// Code generated by sqlc. DO NOT EDIT.
// versions:
//   sqlc v1.28.0
// source: queries_guides.sql

package db

import (
	"context"
	"database/sql"

	"github.com/google/uuid"
)

const addGuide = `-- name: AddGuide :exec
INSERT INTO guides(name, bio, location, expertise, rating, hourly_rate)
VALUES($1, $2, $3, $4, $5, $6)
`

type AddGuideParams struct {
	Name       string
	Bio        string
	Location   string
	Expertise  string
	Rating     int32
	HourlyRate string
}

func (q *Queries) AddGuide(ctx context.Context, arg AddGuideParams) error {
	_, err := q.db.ExecContext(ctx, addGuide,
		arg.Name,
		arg.Bio,
		arg.Location,
		arg.Expertise,
		arg.Rating,
		arg.HourlyRate,
	)
	return err
}

const bookGuide = `-- name: BookGuide :exec
INSERT INTO guide_bookings(guide_id, group_id, status)
VALUES($1, $2, $3)
`

type BookGuideParams struct {
	GuideID uuid.NullUUID
	GroupID uuid.NullUUID
	Status  sql.NullString
}

func (q *Queries) BookGuide(ctx context.Context, arg BookGuideParams) error {
	_, err := q.db.ExecContext(ctx, bookGuide, arg.GuideID, arg.GroupID, arg.Status)
	return err
}

const getGuideDetails = `-- name: GetGuideDetails :many
SELECT id, name, bio, location, expertise, rating, hourly_rate, available FROM guides
WHERE location=$1 AND available=TRUE
`

func (q *Queries) GetGuideDetails(ctx context.Context, location string) ([]Guide, error) {
	rows, err := q.db.QueryContext(ctx, getGuideDetails, location)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var items []Guide
	for rows.Next() {
		var i Guide
		if err := rows.Scan(
			&i.ID,
			&i.Name,
			&i.Bio,
			&i.Location,
			&i.Expertise,
			&i.Rating,
			&i.HourlyRate,
			&i.Available,
		); err != nil {
			return nil, err
		}
		items = append(items, i)
	}
	if err := rows.Close(); err != nil {
		return nil, err
	}
	if err := rows.Err(); err != nil {
		return nil, err
	}
	return items, nil
}

const rejectGuideRequest = `-- name: RejectGuideRequest :exec
DELETE FROM guide_booking_requests
WHERE guide_id=$1 AND group_id=$2
`

type RejectGuideRequestParams struct {
	GuideID uuid.UUID
	GroupID uuid.UUID
}

func (q *Queries) RejectGuideRequest(ctx context.Context, arg RejectGuideRequestParams) error {
	_, err := q.db.ExecContext(ctx, rejectGuideRequest, arg.GuideID, arg.GroupID)
	return err
}

const sendGuideRequest = `-- name: SendGuideRequest :exec
INSERT INTO guide_booking_requests(group_id, user_id, guide_id)
VALUES($1, $2, $3)
`

type SendGuideRequestParams struct {
	GroupID uuid.UUID
	UserID  uuid.UUID
	GuideID uuid.UUID
}

func (q *Queries) SendGuideRequest(ctx context.Context, arg SendGuideRequestParams) error {
	_, err := q.db.ExecContext(ctx, sendGuideRequest, arg.GroupID, arg.UserID, arg.GuideID)
	return err
}

const updateGuideAvail = `-- name: UpdateGuideAvail :exec
UPDATE guides 
SET available=$1
WHERE id=$2
`

type UpdateGuideAvailParams struct {
	Available bool
	ID        uuid.UUID
}

func (q *Queries) UpdateGuideAvail(ctx context.Context, arg UpdateGuideAvailParams) error {
	_, err := q.db.ExecContext(ctx, updateGuideAvail, arg.Available, arg.ID)
	return err
}

const updateGuideRequest = `-- name: UpdateGuideRequest :exec
UPDATE guide_booking_requests 
SET status=$1
WHERE group_id=$1 AND guide_id=$2
`

type UpdateGuideRequestParams struct {
	Status  string
	GuideID uuid.UUID
}

func (q *Queries) UpdateGuideRequest(ctx context.Context, arg UpdateGuideRequestParams) error {
	_, err := q.db.ExecContext(ctx, updateGuideRequest, arg.Status, arg.GuideID)
	return err
}
