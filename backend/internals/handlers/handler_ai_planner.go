package handlers

import (
	"encoding/json"

	"github.com/ErebusAJ/YatraBandhu/internals/db"
	"github.com/ErebusAJ/YatraBandhu/internals/utils"
	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

// generatePlan
// take params generate plan and give response
func(cfg *apiConfig) generatePlan(c *gin.Context){
	var reqDetails struct{
		Location	string	`json:"location" binding:"required"`
		UserQuery	string	`json:"interests" binding:"required"`
		Days		int		`json:"days" binding:"required"`
	}

	tempID, exists := c.Get("userID")
	if !exists {
		utils.ErrorJSON(c, 400, utils.MiddlewareError, utils.UnauthorizedError, nil)
		return 
	}
	userID := tempID.(uuid.UUID)

	err := c.BindJSON(&reqDetails)
	if err != nil{
		utils.ErrorJSON(c, 400, utils.RequestBodyError, utils.JSONError, err)
		return
	}

	jsonData, err := utils.GenerateTravelItinerary(reqDetails.Location, reqDetails.UserQuery, reqDetails.Days)
	if err != nil{
		utils.ErrorJSON(c, 500, "error generating plan", utils.InternalError, err)
		return 
	}

	jsonBytes, err := json.Marshal(jsonData)
	if err != nil{
		utils.ErrorJSON(c, 500, "ai plan marshaling error", utils.InternalError, err)
		return 
	}

	err = cfg.DB.SavePlan(c, db.SavePlanParams{
		UserID: userID,
		RawData: jsonBytes,
	})
	if err != nil{
		utils.ErrorJSON(c, 500, utils.DatabaseError, utils.InternalError, err)
		return
	}

	c.IndentedJSON(200, jsonData)
}