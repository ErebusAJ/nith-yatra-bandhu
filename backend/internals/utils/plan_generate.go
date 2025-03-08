package utils

import (
	"bufio"
	"bytes"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"log"
	"net/http"
	"net/url"
	"os"
	"strconv"
	"strings"
	"time"

	"github.com/joho/godotenv"
)

// Replace these constants with your actual API credentials.
const (
	CF_API_URL            = "https://api.cloudflare.com/client/v4/accounts/%v/ai/run/%v"
	CF_MODEL              = "@cf/mistral/mistral-7b-instruct-v0.1" 
	MAX_TOKENS            = 1800
	DefaultTravelDuration = 3
)

//
// 1. Mapbox Functions
//

// getCoordinates calls the Mapbox Geocoding API to fetch coordinates for a location.
func getCoordinates(location, mapboxToken string) ([]float64, error) {
	endpoint := fmt.Sprintf("https://api.mapbox.com/geocoding/v5/mapbox.places/%s.json", url.PathEscape(location))
	params := url.Values{}
	params.Set("access_token", mapboxToken)
	params.Set("limit", "1")
	urlWithParams := fmt.Sprintf("%s?%s", endpoint, params.Encode())

	client := http.Client{Timeout: 10 * time.Second}
	resp, err := client.Get(urlWithParams)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()
	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("Mapbox API error: status %d", resp.StatusCode)
	}

	var result struct {
		Features []struct {
			Center []float64 `json:"center"`
		} `json:"features"`
	}
	if err = json.NewDecoder(resp.Body).Decode(&result); err != nil {
		return nil, err
	}
	if len(result.Features) == 0 || len(result.Features[0].Center) < 2 {
		return nil, errors.New("no coordinates found")
	}
	return result.Features[0].Center, nil
}

// getMapboxPOIs fetches points of interest (POIs) for a category using Mapbox.
func getMapboxPOIs(location, category string, limit int, token string) ([]string, error) {
	// Get coordinates first
	_, err := getCoordinates(location, token)
	if err != nil {
		return nil, err
	}

	endpoint := fmt.Sprintf("https://api.mapbox.com/geocoding/v5/mapbox.places/%s.json", url.PathEscape(category))
	params := url.Values{}
	params.Set("access_token", token)
	params.Set("limit", strconv.Itoa(limit))
	// Optionally, add a proximity parameter if needed.
	urlWithParams := fmt.Sprintf("%s?%s", endpoint, params.Encode())

	client := http.Client{Timeout: 10 * time.Second}
	resp, err := client.Get(urlWithParams)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()
	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("Mapbox POI error: status %d", resp.StatusCode)
	}

	var result struct {
		Features []struct {
			Text string `json:"text"`
		} `json:"features"`
	}
	if err = json.NewDecoder(resp.Body).Decode(&result); err != nil {
		return nil, err
	}
	var pois []string
	for _, feature := range result.Features {
		if feature.Text != "" {
			pois = append(pois, feature.Text)
		}
	}
	return pois, nil
}

//
// 2. TomTom and Wikipedia Functions
//

// getTomtomPOIs calls the TomTom API to fetch POIs based on coordinates.
func getTomtomPOIs(coords []float64, category string, limit int, apiKey string) ([]string, error) {
	if len(coords) < 2 {
		return nil, errors.New("invalid coordinates")
	}

	endpoint := "https://api.tomtom.com/search/2/categorySearch/.json"
	params := url.Values{}
	params.Set("key", apiKey)
	params.Set("lat", fmt.Sprintf("%f", coords[1]))
	params.Set("lon", fmt.Sprintf("%f", coords[0]))
	params.Set("limit", strconv.Itoa(limit))
	// The categorySet can be adjusted based on the category.
	params.Set("categorySet", "7376")
	urlWithParams := fmt.Sprintf("%s?%s", endpoint, params.Encode())

	client := http.Client{Timeout: 10 * time.Second}
	resp, err := client.Get(urlWithParams)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()
	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("TomTom API error: status %d", resp.StatusCode)
	}

	var result struct {
		Results []struct {
			Poi struct {
				Name string `json:"name"`
			} `json:"poi"`
		} `json:"results"`
	}
	if err = json.NewDecoder(resp.Body).Decode(&result); err != nil {
		return nil, err
	}
	var pois []string
	for _, r := range result.Results {
		if r.Poi.Name != "" {
			pois = append(pois, r.Poi.Name)
		}
	}
	return pois, nil
}

// getLocationInfo fetches a brief summary of the location from Wikipedia.
func getLocationInfo(locationName string) (string, error) {
	sanitized := strings.ReplaceAll(locationName, " ", "_")
	urlStr := fmt.Sprintf("https://en.wikipedia.org/api/rest_v1/page/summary/%s", sanitized)
	client := http.Client{Timeout: 5 * time.Second}
	resp, err := client.Get(urlStr)
	if err != nil {
		return "", err
	}
	defer resp.Body.Close()
	if resp.StatusCode != http.StatusOK {
		// Fallback if not available
		return fmt.Sprintf("%s is a fascinating destination with rich history and cultural significance.", locationName), nil
	}
	var result struct {
		Extract string `json:"extract"`
	}
	if err = json.NewDecoder(resp.Body).Decode(&result); err != nil {
		return "", err
	}
	if result.Extract == "" {
		return fmt.Sprintf("%s is a fascinating destination with rich history and cultural significance.", locationName), nil
	}
	return result.Extract, nil
}

//
// 3. Transportation and Weather Functions
//

// getTransportationInfo calls Mapbox's directions matrix API to get travel durations.
func getTransportationInfo(coords []float64, mapboxToken string) (string, error) {
	endpoint := "https://api.mapbox.com/directions-matrix/v1/mapbox/driving"
	params := url.Values{}
	params.Set("access_token", mapboxToken)
	params.Set("sources", fmt.Sprintf("%f,%f", coords[0], coords[1]))
	params.Set("annotations", "duration")
	urlWithParams := fmt.Sprintf("%s?%s", endpoint, params.Encode())

	client := http.Client{Timeout: 10 * time.Second}
	resp, err := client.Get(urlWithParams)
	if err != nil {
		return "", err
	}
	defer resp.Body.Close()
	if resp.StatusCode != http.StatusOK {
		return "", fmt.Errorf("Mapbox directions error: status %d", resp.StatusCode)
	}

	var result struct {
		Durations [][]float64 `json:"durations"`
	}
	if err = json.NewDecoder(resp.Body).Decode(&result); err != nil {
		return "", err
	}
	if len(result.Durations) == 0 || len(result.Durations[0]) == 0 {
		return "Typical travel time: 15-45 mins", nil
	}
	sum := 0.0
	count := 0
	for _, d := range result.Durations[0] {
		if d > 0 {
			sum += d
			count++
		}
	}
	if count == 0 {
		return "Typical travel time: 15-45 mins", nil
	}
	avg := sum / float64(count) / 60.0
	return fmt.Sprintf("Average travel time: %.1f mins", avg), nil
}

// getWeatherContext returns a placeholder weather context.
// (You can implement a real weather API call as needed.)
func getWeatherContext(coords []float64) (string, error) {
	return "Weather data not implemented", nil
}

//
// 4. Data Aggregation and Prompt Formatting
//

// TravelData holds aggregated travel information.
type TravelData struct {
	LocationInfo   string   `json:"location_info"`
	Hotels         []string `json:"hotels"`
	Attractions    []string `json:"attractions"`
	Transportation string   `json:"transportation"`
	Weather        string   `json:"weather"`
}

// uniqueStrings returns unique strings from a slice.
func uniqueStrings(input []string) []string {
	seen := make(map[string]bool)
	var result []string
	for _, str := range input {
		if !seen[str] {
			seen[str] = true
			result = append(result, str)
		}
	}
	return result
}

// collectTravelData aggregates data from various APIs.
func collectTravelData(location string, numDays int, mapboxToken, tomtomKey string) (*TravelData, error) {
	coords, err := getCoordinates(location, mapboxToken)
	if err != nil {
		return nil, fmt.Errorf("could not retrieve coordinates for location: %v", err)
	}
	// Use the first part of the location for Wikipedia info.
	parts := strings.Split(location, ",")
	locInfo, err := getLocationInfo(strings.TrimSpace(parts[0]))
	if err != nil {
		locInfo = fmt.Sprintf("%s is a fascinating destination with rich history and cultural significance.", location)
	}

	mapboxHotels, _ := getMapboxPOIs(location, "hotel", 10, mapboxToken)
	tomtomHotels, _ := getTomtomPOIs(coords, "hotel", 10, tomtomKey)
	hotels := uniqueStrings(append(mapboxHotels, tomtomHotels...))
	if len(hotels) > 10 {
		hotels = hotels[:10]
	}

	mapboxAttractions, _ := getMapboxPOIs(location, "attraction", numDays*4, mapboxToken)
	tomtomAttractions, _ := getTomtomPOIs(coords, "attraction", numDays*4, tomtomKey)
	attractions := uniqueStrings(append(mapboxAttractions, tomtomAttractions...))
	if len(attractions) > numDays*4 {
		attractions = attractions[:numDays*4]
	}

	transportation, _ := getTransportationInfo(coords, mapboxToken)
	weather, _ := getWeatherContext(coords)

	return &TravelData{
		LocationInfo:   locInfo,
		Hotels:         hotels,
		Attractions:    attractions,
		Transportation: transportation,
		Weather:        weather,
	}, nil
}

// formatPrompt creates the itinerary generation prompt.
func formatPrompt(ragData *TravelData, userQuery string, numDays int) string {
	hotelsSample := ""
	if len(ragData.Hotels) >= 3 {
		hotelsSample = strings.Join(ragData.Hotels[:3], ", ")
	} else {
		hotelsSample = strings.Join(ragData.Hotels, ", ")
	}

	attractionsSample := ""
	if len(ragData.Attractions) >= 6 {
		attractionsSample = strings.Join(ragData.Attractions[:6], ", ")
	} else {
		attractionsSample = strings.Join(ragData.Attractions, ", ")
	}

	prompt := fmt.Sprintf(`<s>[INST] Create a detailed %d-day travel itinerary with these components:

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

Include practical tips and safety considerations where relevant.
[/INST]</s>`, numDays, ragData.LocationInfo, hotelsSample, attractionsSample, ragData.Transportation, ragData.Weather, userQuery)
	return prompt
}

//
// 5. Cloudflare AI Itinerary Generation
//

// generateItinerary sends the prompt to Cloudflare's AI API.
func generateItinerary(prompt, accountID string) (string, error) {
	urlStr := fmt.Sprintf(CF_API_URL, accountID, CF_MODEL)
	payload := map[string]interface{}{
		"prompt":      prompt,
		"max_tokens":  MAX_TOKENS,
		"temperature": 0.7,
		"top_p":       0.9,
		"stream":      false,
	}
	jsonData, err := json.Marshal(payload)
	if err != nil {
		return "", err
	}

	req, err := http.NewRequest("POST", urlStr, bytes.NewBuffer(jsonData))
	if err != nil {
		return "", err
	}

	godotenv.Load()
	CLOUDFLARE_API_KEY := os.Getenv("CLOUDFLARE_API_KEY")
	if CLOUDFLARE_API_KEY == ""{
		log.Fatalf("error getting CLOUDFLARE_API_KEY")
	}

	req.Header.Set("Authorization", fmt.Sprintf("Bearer %s", CLOUDFLARE_API_KEY))
	req.Header.Set("Content-Type", "application/json")

	client := http.Client{Timeout: 300 * time.Second}
	resp, err := client.Do(req)
	if err != nil {
		return "", err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		bodyBytes, _ := io.ReadAll(resp.Body)
		return "", fmt.Errorf("Cloudflare API error: status %d, body: %s", resp.StatusCode, string(bodyBytes))
	}

	var result struct {
		Result struct {
			Response string `json:"response"`
		} `json:"result"`
	}
	if err = json.NewDecoder(resp.Body).Decode(&result); err != nil {
		return "", err
	}
	if result.Result.Response == "" {
		return "Error generating itinerary", nil
	}
	return result.Result.Response, nil
}

//
// 6. Main Function: User Interaction Flow
//

func GeneratePlan() (string, error) {
	reader := bufio.NewReader(os.Stdin)

	fmt.Print("Enter destination (e.g., 'Rome, Italy'): ")
	location, _ := reader.ReadString('\n')
	location = strings.TrimSpace(location)

	fmt.Print("Describe your travel preferences: ")
	userQuery, _ := reader.ReadString('\n')
	userQuery = strings.TrimSpace(userQuery)

	fmt.Print("Number of days (3-10): ")
	numDaysStr, _ := reader.ReadString('\n')
	numDaysStr = strings.TrimSpace(numDaysStr)
	numDays, err := strconv.Atoi(numDaysStr)
	if err != nil || numDays < 1 || numDays > 10 {
		numDays = DefaultTravelDuration
		fmt.Printf("Using default duration: %d days\n", numDays)
	}

	// Provide your API tokens/keys here (or load from environment variables)
	MAPBOX_TOKEN := os.Getenv("MAPBOX_TOKEN")
	TOMTOM_API_KEY := os.Getenv("TOMTOM_API_KEY")
	CLOUDFLARE_ACC_ID := os.Getenv("CLOUDFLARE_ACC_ID")
	if MAPBOX_TOKEN == "" || TOMTOM_API_KEY == "" || CLOUDFLARE_ACC_ID == ""{
		log.Fatalf("error retrieving env API keys")
	}

	fmt.Println("Collecting travel data...")
	ragData, err := collectTravelData(location, numDays, MAPBOX_TOKEN, TOMTOM_API_KEY)
	if err != nil {
		log.Fatalf("Error collecting travel data: %v", err)
	}

	prompt := formatPrompt(ragData, userQuery, numDays)
	fmt.Println("Generating itinerary via Cloudflare AI...")
	itinerary, err := generateItinerary(prompt, CLOUDFLARE_ACC_ID)
	if err != nil {
		log.Fatalf("Error generating itinerary: %v", err)
	}

	fmt.Println("=== TRAVEL PLAN ===")
	if itinerary == ""{
		return "", fmt.Errorf("error generating itinerary")
	}

	return itinerary, nil
}
