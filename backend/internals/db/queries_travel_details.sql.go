// Code generated by sqlc. DO NOT EDIT.
// versions:
//   sqlc v1.28.0
// source: queries_travel_details.sql

package db

import (
	"context"

	"github.com/google/uuid"
	"github.com/lib/pq"
)

const addTravelDetails = `-- name: AddTravelDetails :exec
INSERT INTO travel_plan_details(creator_id, place, start_date, end_date, trip_type, pets, interests)
VALUES($1, $2, $3, $4, $5, $6, $7)
`

type AddTravelDetailsParams struct {
	CreatorID uuid.UUID
	Place     string
	StartDate string
	EndDate   string
	TripType  string
	Pets      bool
	Interests []string
}

func (q *Queries) AddTravelDetails(ctx context.Context, arg AddTravelDetailsParams) error {
	_, err := q.db.ExecContext(ctx, addTravelDetails,
		arg.CreatorID,
		arg.Place,
		arg.StartDate,
		arg.EndDate,
		arg.TripType,
		arg.Pets,
		pq.Array(arg.Interests),
	)
	return err
}

const getUserPlansDetails = `-- name: GetUserPlansDetails :many
SELECT t.place, t.start_date, t.end_date, t.trip_type, t.pets, t.interests
FROM travel_plan_details as t
INNER JOIN users ON users.id = t.creator_id
WHERE users.id = $1
`

type GetUserPlansDetailsRow struct {
	Place     string
	StartDate string
	EndDate   string
	TripType  string
	Pets      bool
	Interests []string
}

func (q *Queries) GetUserPlansDetails(ctx context.Context, id uuid.UUID) ([]GetUserPlansDetailsRow, error) {
	rows, err := q.db.QueryContext(ctx, getUserPlansDetails, id)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var items []GetUserPlansDetailsRow
	for rows.Next() {
		var i GetUserPlansDetailsRow
		if err := rows.Scan(
			&i.Place,
			&i.StartDate,
			&i.EndDate,
			&i.TripType,
			&i.Pets,
			pq.Array(&i.Interests),
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
