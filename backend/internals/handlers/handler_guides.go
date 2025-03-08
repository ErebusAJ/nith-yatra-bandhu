package handlers

import (

	"github.com/ErebusAJ/YatraBandhu/internals/db"
	"github.com/ErebusAJ/YatraBandhu/internals/utils"
	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

// registerGuides
func(cfg *apiConfig) registerGuides(c *gin.Context){
	var reqDetails struct{
		Name		string	`json:"name" binding:"required"`
		Bio			string	`json:"bio" binding:"required"`
		Location	string	`json:"loacation" binding:"required"`
		Expertise	string 	`json:"expertise" binding:"required"`
		Rating		int		`json:"rating" binding:"required"`
		HourRate	string	`json:"hourly_rate" binding:"required"`
	}

	err := c.BindJSON(&reqDetails)
	if err != nil{
		utils.ErrorJSON(c, 400, utils.RequestBodyError, utils.InternalError, err)
		return
	}

	err = cfg.DB.AddGuide(c, db.AddGuideParams{
		Name: reqDetails.Name,
		Bio: reqDetails.Bio,
		Location: reqDetails.Location,
		Expertise: reqDetails.Expertise,
		Rating: int32(reqDetails.Rating),
		HourlyRate: reqDetails.HourRate,
	})
	if err != nil {
		utils.ErrorJSON(c, 500, utils.DatabaseError, utils.InternalError, err)
		return 
	}

	c.IndentedJSON(200, utils.MessageObj("guide registered"))
}

// sendBookRequest
func(cfg *apiConfig) sendBookRequest(c *gin.Context){
	tempID, exists := c.Get("userID")
	if !exists {
		utils.ErrorJSON(c, 401, utils.MiddlewareError, utils.UnauthorizedError, nil)
		return
	}
	userID := tempID.(uuid.UUID)

	tempGID := c.Param("groupID")
	groupID, err := uuid.Parse(tempGID)
	if err != nil {
		utils.ErrorJSON(c, 400, utils.ParsingError, utils.JSONError, err)
	}

	tempgID := c.Param("guideID")
	guideID, err := uuid.Parse(tempgID)
	if err != nil{
		utils.ErrorJSON(c, 400, utils.ParsingError, utils.JSONError, err)
		return 
	} 

	err = cfg.DB.SendGuideRequest(c, db.SendGuideRequestParams{
		GroupID: groupID,
		GuideID: guideID,
		UserID: userID,
	})
	if err != nil{
		utils.ErrorJSON(c, 500, utils.DatabaseError, utils.InternalError, err)
		return
	}

	c.IndentedJSON(200, utils.MessageObj("request sent"))
}


// getGuideDetails
func(cfg *apiConfig) getGuideDetails(c *gin.Context){
	var reqDetails struct{
		Location 	string	`json:"location" binding:"required"`
	}

	guides, err := cfg.DB.GetGuideDetails(c, reqDetails.Location)
	if err != nil{
		utils.ErrorJSON(c, 500, utils.DatabaseError, utils.InternalError, err)
		return
	}

	c.IndentedJSON(200, guides)
}