package utils

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"net/url"
	"os"
	"strconv"
	"strings"
	"time"

	"github.com/joho/godotenv"
)

const (
	CFModel     = "@cf/mistral/mistral-7b-instruct-v0.1"
	MaxTokens   = 1800
	DefaultDays = 3
)

type WeatherData struct {
	CurrentTemp float64
	CurrentWind float64
	CurrentCode int
	MaxTemp     float64
	MinTemp     float64
	MaxWind     float64
	DailyCode   int
}

type RiskDetails struct {
	Percentage int
	Factors    []string
}

type TravelData struct {
	LocationInfo   string
	Hotels         []string
	Attractions    []string
	Transportation string
	Weather        string
	RiskFactor     string
	RiskDetails    RiskDetails
}

func getCoordinates(location, token string) ([]float64, error) {
	escapedLocation := url.PathEscape(location)
	url := fmt.Sprintf("https://api.mapbox.com/geocoding/v5/mapbox.places/%s.json", escapedLocation)

	client := &http.Client{Timeout: 10 * time.Second}
	req, err := http.NewRequest("GET", url, nil)
	if err != nil {
		return nil, err
	}

	q := req.URL.Query()
	q.Add("access_token", token)
	q.Add("limit", "1")
	req.URL.RawQuery = q.Encode()

	resp, err := client.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("API returned status %d", resp.StatusCode)
	}

	var data struct {
		Features []struct {
			Center []float64 `json:"center"`
		} `json:"features"`
	}

	if err := json.NewDecoder(resp.Body).Decode(&data); err != nil {
		return nil, err
	}

	if len(data.Features) == 0 || len(data.Features[0].Center) < 2 {
		return nil, fmt.Errorf("no coordinates found")
	}

	return []float64{data.Features[0].Center[0], data.Features[0].Center[1]}, nil
}

func getMapboxPOIs(location, category string, limit int, token string) ([]string, error) {
	coords, err := getCoordinates(location, token)
	if err != nil {
		return nil, err
	}

	escapedCategory := url.PathEscape(category)
	url := fmt.Sprintf("https://api.mapbox.com/geocoding/v5/mapbox.places/%s.json", escapedCategory)

	client := &http.Client{Timeout: 10 * time.Second}
	req, err := http.NewRequest("GET", url, nil)
	if err != nil {
		return nil, err
	}

	q := req.URL.Query()
	q.Add("access_token", token)
	q.Add("limit", strconv.Itoa(limit))
	q.Add("proximity", fmt.Sprintf("%f,%f", coords[0], coords[1]))
	req.URL.RawQuery = q.Encode()

	resp, err := client.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("API returned status %d", resp.StatusCode)
	}

	var result struct {
		Features []struct {
			Text string `json:"text"`
		} `json:"features"`
	}

	if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
		return nil, err
	}

	var pois []string
	for _, f := range result.Features {
		if f.Text != "" {
			pois = append(pois, f.Text)
		}
	}
	return pois, nil
}

func getTomTomPOIs(coords []float64, category string, limit int, apiKey string) ([]string, error) {
	if len(coords) < 2 {
		return nil, fmt.Errorf("invalid coordinates")
	}

	url := "https://api.tomtom.com/search/2/categorySearch/.json"
	client := &http.Client{Timeout: 10 * time.Second}
	req, err := http.NewRequest("GET", url, nil)
	if err != nil {
		return nil, err
	}

	q := req.URL.Query()
	q.Add("key", apiKey)
	q.Add("lat", strconv.FormatFloat(coords[1], 'f', -1, 64))
	q.Add("lon", strconv.FormatFloat(coords[0], 'f', -1, 64))
	q.Add("limit", strconv.Itoa(limit))
	q.Add("categorySet", "7376")
	req.URL.RawQuery = q.Encode()

	resp, err := client.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("API returned status %d", resp.StatusCode)
	}

	var data struct {
		Results []struct {
			Poi struct {
				Name string `json:"name"`
			} `json:"poi"`
		} `json:"results"`
	}

	if err := json.NewDecoder(resp.Body).Decode(&data); err != nil {
		return nil, err
	}

	var pois []string
	for _, r := range data.Results {
		if r.Poi.Name != "" {
			pois = append(pois, r.Poi.Name)
		}
	}
	return pois, nil
}

func getWeatherData(coords []float64) (*WeatherData, error) {
	url := "https://api.open-meteo.com/v1/forecast"
	client := &http.Client{Timeout: 10 * time.Second}
	req, err := http.NewRequest("GET", url, nil)
	if err != nil {
		return nil, err
	}

	q := req.URL.Query()
	q.Add("latitude", strconv.FormatFloat(coords[1], 'f', -1, 64))
	q.Add("longitude", strconv.FormatFloat(coords[0], 'f', -1, 64))
	q.Add("current_weather", "true")
	q.Add("daily", "weathercode,temperature_2m_max,temperature_2m_min,windspeed_10m_max")
	q.Add("timezone", "auto")
	q.Add("forecast_days", "1")
	req.URL.RawQuery = q.Encode()

	resp, err := client.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("API returned status %d", resp.StatusCode)
	}

	var response struct {
		CurrentWeather struct {
			Temperature float64 `json:"temperature"`
			Windspeed   float64 `json:"windspeed"`
			Weathercode int     `json:"weathercode"`
		} `json:"current_weather"`
		Daily struct {
			Weathercode      []int     `json:"weathercode"`
			Temperature2mMax []float64 `json:"temperature_2m_max"`
			Temperature2mMin []float64 `json:"temperature_2m_min"`
			Windspeed10mMax  []float64 `json:"windspeed_10m_max"`
		} `json:"daily"`
	}

	if err := json.NewDecoder(resp.Body).Decode(&response); err != nil {
		return nil, err
	}

	wd := &WeatherData{
		CurrentTemp: response.CurrentWeather.Temperature,
		CurrentWind: response.CurrentWeather.Windspeed,
		CurrentCode: response.CurrentWeather.Weathercode,
	}

	if len(response.Daily.Temperature2mMax) > 0 {
		wd.MaxTemp = response.Daily.Temperature2mMax[0]
	}
	if len(response.Daily.Temperature2mMin) > 0 {
		wd.MinTemp = response.Daily.Temperature2mMin[0]
	}
	if len(response.Daily.Windspeed10mMax) > 0 {
		wd.MaxWind = response.Daily.Windspeed10mMax[0]
	}
	if len(response.Daily.Weathercode) > 0 {
		wd.DailyCode = response.Daily.Weathercode[0]
	}

	return wd, nil
}

func interpretWeatherCode(code int) string {
	weatherDescriptions := map[int]string{
		0: "Clear sky",
		// Add all other weather codes here
	}
	if desc, ok := weatherDescriptions[code]; ok {
		return desc
	}
	return "Unknown weather condition"
}

func formatWeather(wd *WeatherData) string {
	if wd == nil {
		return "Weather information unavailable"
	}

	var elements []string
	if wd.CurrentTemp != 0 {
		elements = append(elements, fmt.Sprintf("%.1f°C", wd.CurrentTemp))
	}
	if wd.CurrentWind != 0 {
		elements = append(elements, fmt.Sprintf("Wind: %.1f km/h", wd.CurrentWind))
	}
	if desc := interpretWeatherCode(wd.CurrentCode); desc != "" {
		elements = append(elements, desc)
	}

	if len(elements) > 0 {
		return "Current: " + strings.Join(elements, ", ")
	}
	return "Weather data unavailable"
}

func calculateRiskFactor(wd *WeatherData) int {
	if wd == nil {
		return 0
	}

	risk := 0
	// Add risk calculation logic
	return min(risk, 100)
}

func getLocationInfo(locationName string) string {
	// Implement Wikipedia API call
	return fmt.Sprintf("%s is a fascinating destination with rich history and cultural significance.", locationName)
}

func getTransportationInfo(coords []float64, token string) string {
	// Implement Mapbox directions API call
	return "Typical travel time: 15-45 mins"
}

func collectTravelData(location string, numDays int, mapboxToken, tomtomKey string) (*TravelData, error) {
	coords, err := getCoordinates(location, mapboxToken)
	if err != nil {
		return nil, fmt.Errorf("could not retrieve coordinates: %v", err)
	}

	weatherData, err := getWeatherData(coords)
	if err != nil {
		return nil, fmt.Errorf("could not get weather data: %v", err)
	}

	riskPercentage := calculateRiskFactor(weatherData)

	// Collect POIs from both services
	hotels := unique(append(
		getPOISafe(getMapboxPOIs(location, "hotel", 10, mapboxToken)),
		getPOISafe(getTomTomPOIs(coords, "hotel", 10, tomtomKey))...,
	))[:10]

	attractions := unique(append(
		getPOISafe(getMapboxPOIs(location, "attraction", numDays*4, mapboxToken)),
		getPOISafe(getTomTomPOIs(coords, "attraction", numDays*4, tomtomKey))...,
	))[:numDays*4]

	return &TravelData{
		LocationInfo:   getLocationInfo(strings.Split(location, ",")[0]),
		Hotels:         hotels,
		Attractions:    attractions,
		Transportation: getTransportationInfo(coords, mapboxToken),
		Weather:        formatWeather(weatherData),
		RiskFactor:     fmt.Sprintf("%d%%", riskPercentage),
		RiskDetails: RiskDetails{
			Percentage: riskPercentage,
			Factors:    getRiskFactors(weatherData, riskPercentage),
		},
	}, nil
}

func getPOISafe(pois []string, err error) []string {
	if err != nil {
		return []string{}
	}
	return pois
}

func unique(slice []string) []string {
	keys := make(map[string]bool)
	result := []string{}
	for _, item := range slice {
		if !keys[item] {
			keys[item] = true
			result = append(result, item)
		}
	}
	return result
}

func getRiskFactors(wd *WeatherData, risk int) []string {
	// Implement risk factor calculation
	return []string{"No significant weather risks detected"}
}

func formatPrompt(ragData *TravelData, userQuery string, numDays int) string {
    hotels := strings.Join(ragData.Hotels[:min(3, len(ragData.Hotels))], ", ")
    attractions := strings.Join(ragData.Attractions[:min(6, len(ragData.Attractions))], ", ")
    riskFactors := strings.Join(ragData.RiskDetails.Factors, ", ")

    return fmt.Sprintf(`<s>[INST] Create a detailed %d-day travel itinerary with these components:

Destination Context: %s

Key Information:
- Available Hotels: %s
- Top Attractions: %s
- Transportation Details: %s
- Current Weather: %s
- User Preferences: %s

Structure Requirements:
1. Daily schedule with time blocks (Morning/Afternoon/Evening)
2. Historical context for each main attraction
3. Cultural significance explanations
4. Local dining suggestions near activities
5. Hotel recommendations with proximity notes

Final Section:
- Safety Summary: %s overall risk
  * Primary factors: %s
  * Weather-adjusted recommendations
  * Emergency preparedness tips[/INST]</s>`,
        numDays,
        ragData.LocationInfo,
        hotels,
        attractions,
        ragData.Transportation,
        ragData.Weather,
        userQuery,
        ragData.RiskFactor,
        riskFactors,
    )
}

func min(a, b int) int {
    if a < b {
        return a
    }
    return b
}

func generateItinerary(prompt, accountID, apiKey string) (string, error) {
    url := fmt.Sprintf("https://api.cloudflare.com/client/v4/accounts/%s/ai/run/%s", accountID, CFModel)

    payload := map[string]interface{}{
        "prompt":      prompt,
        "max_tokens":  MaxTokens,
        "temperature": 0.7,
        "top_p":       0.9,
        "stream":      false,
    }

    jsonPayload, err := json.Marshal(payload)
    if err != nil {
        return "", fmt.Errorf("error marshaling payload: %w", err)
    }

    req, err := http.NewRequest("POST", url, bytes.NewBuffer(jsonPayload))
    if err != nil {
        return "", fmt.Errorf("error creating request: %w", err)
    }

    req.Header.Set("Authorization", "Bearer "+apiKey)
    req.Header.Set("Content-Type", "application/json")

    client := &http.Client{Timeout: 300 * time.Second}
    resp, err := client.Do(req)
    if err != nil {
        return "", fmt.Errorf("API request failed: %w", err)
    }
    defer resp.Body.Close()

    if resp.StatusCode != http.StatusOK {
        body, _ := io.ReadAll(resp.Body)
        return "", fmt.Errorf("API returned status %d: %s", resp.StatusCode, string(body))
    }

    var result struct {
        Result struct {
            Response string `json:"response"`
        } `json:"result"`
        Success bool   `json:"success"`
        Errors  []any  `json:"errors"`
    }

    if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
        return "", fmt.Errorf("error decoding response: %w", err)
    }

    if !result.Success || len(result.Errors) > 0 {
        return "", fmt.Errorf("API errors: %v", result.Errors)
    }

    return result.Result.Response, nil
}

func convertToJSON(textItinerary string, numDays int, apiKey string) (map[string]interface{}, error) {
	today := time.Now()
	startDate := today.Format("2006-01-02")
	endDate := today.AddDate(0, 0, numDays-1).Format("2006-01-02")

	prompt := fmt.Sprintf(`Convert this %d-day travel itinerary into structured JSON:

    %s

    Use this exact JSON structure:
    {
      "destination": "City, Country",
      "travel_duration": {
        "total_days": %d,
        "start_date": "%s",
        "end_date": "%s"
      },
      "daily_itinerary": [
        {
          "day_number": 1,
          "date": "%s",
          "weather": {
            "temperature": "22°C",
            "conditions": "Sunny"
          },
          "activities": [
            {
              "time_slot": "Morning",
              "name": "Activity Name",
              "type": "Cultural/Historical/Leisure",
              "duration": "2 hours",
              "description": "Detailed description",
              "location": {
                "name": "Location Name",
                "coordinates": [12.34, 56.78]
              },
              "tips": ["Practical advice"]
            }
          ],
          "dining": [
            {
              "meal_type": "Lunch",
              "name": "Restaurant Name",
              "cuisine": "Italian",
              "address": "Street Address"
            }
          ],
          "accommodation": {
            "name": "Hotel Name",
            "proximity_to_attractions": "500m from city center"
          },
          "transportation": [
            {
              "type": "Public Transit",
              "details": "Take metro line A to Central Station"
            }
          ]
        }
      ],
      "key_highlights": {
        "top_attractions": ["Attraction 1", "Attraction 2"],
        "must_try_foods": ["Food 1", "Food 2"]
      },
      "safety_considerations": {
        "general_advice": ["Stay alert in crowded areas"],
        "emergency_numbers": ["112"]
      }
    }

    Rules:
    1. Maintain all information from original text
    2. Generate realistic coordinates based on location
    3. Estimate missing time/duration logically
    4. Preserve exact names from original text
    5. Maintain EXACT day count: %d days
    6. Use provided dates: %s to %s
    7. Never shorten the duration
    8. Include null values for missing optional fields
    9. Add realistic weather data if missing`,
		numDays, textItinerary, numDays, startDate, endDate,
		startDate, numDays, startDate, endDate)

	url := "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent"
	client := &http.Client{Timeout: 30 * time.Second}

	payload := map[string]interface{}{
		"contents": []interface{}{
			map[string]interface{}{
				"parts": []interface{}{
					map[string]string{"text": prompt},
				},
			},
		},
	}

	jsonPayload, err := json.Marshal(payload)
	if err != nil {
		return nil, fmt.Errorf("error creating request payload: %v", err)
	}

	req, err := http.NewRequest("POST", url, bytes.NewBuffer(jsonPayload))
	if err != nil {
		return nil, fmt.Errorf("error creating request: %v", err)
	}

	q := req.URL.Query()
	q.Add("key", apiKey)
	req.URL.RawQuery = q.Encode()
	req.Header.Set("Content-Type", "application/json")

	resp, err := client.Do(req)
	if err != nil {
		return nil, fmt.Errorf("API request failed: %v", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		body, _ := io.ReadAll(resp.Body)
		return nil, fmt.Errorf("API returned status %d: %s", resp.StatusCode, body)
	}

	var result struct {
		Candidates []struct {
			Content struct {
				Parts []struct {
					Text string `json:"text"`
				} `json:"parts"`
			} `json:"content"`
		} `json:"candidates"`
	}

	if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
		return nil, fmt.Errorf("error decoding response: %v", err)
	}

	if len(result.Candidates) == 0 || len(result.Candidates[0].Content.Parts) == 0 {
		return nil, fmt.Errorf("no valid response from Gemini")
	}

	jsonText := result.Candidates[0].Content.Parts[0].Text

	// Clean up JSON wrapping
	if strings.Contains(jsonText, "```json") {
		jsonText = strings.SplitN(jsonText, "```json", 2)[1]
		jsonText = strings.SplitN(jsonText, "```", 2)[0]
	}

	var jsonData map[string]interface{}
	if err := json.Unmarshal([]byte(jsonText), &jsonData); err != nil {
		return nil, fmt.Errorf("error unmarshaling JSON: %v\nResponse text: %s", err, jsonText)
	}

	return jsonData, nil
}

func GenerateTravelItinerary(location, userQuery string, numDays int) (map[string]interface{}, error) {
	godotenv.Load()

	cloudflareAPIKey := os.Getenv("CLOUDFLARE_API_KEY")
	geminiAPIKey := os.Getenv("GEMINI_API_KEY")
	mapboxToken := os.Getenv("MAPBOX_TOKEN")
	tomtomAPIKey := os.Getenv("TOMTOM_API_KEY")
	cloudflareAccountID := os.Getenv("CLOUDFLARE_ACC_ID")

	fmt.Println("Collecting data...")
	travelData, err := collectTravelData(location, numDays, mapboxToken, tomtomAPIKey)
	if err != nil {
		fmt.Printf("Error: %v\n", err)
		return nil, err
	}

	prompt := formatPrompt(travelData, userQuery, numDays)

	fmt.Println("Generating itinerary...")
	itinerary, err := generateItinerary(prompt, cloudflareAccountID, cloudflareAPIKey)
	if err != nil {
		fmt.Printf("Error: %v\n", err)
		return nil, err
	}

	fmt.Println(itinerary)

	fmt.Println("Converting to JSON...")
	jsonItinerary, err := convertToJSON(itinerary, numDays, geminiAPIKey)
	if err != nil {
		fmt.Printf("Error: %v\n", err)
		return nil, err
	}

	return jsonItinerary, err
}
