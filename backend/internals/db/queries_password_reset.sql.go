// Code generated by sqlc. DO NOT EDIT.
// versions:
//   sqlc v1.28.0
// source: queries_password_reset.sql

package db

import (
	"context"
	"time"

	"github.com/google/uuid"
)

const deleteToken = `-- name: DeleteToken :exec
DELETE FROM password_tokens
WHERE token=$1
`

func (q *Queries) DeleteToken(ctx context.Context, token string) error {
	_, err := q.db.ExecContext(ctx, deleteToken, token)
	return err
}

const getUserToken = `-- name: GetUserToken :one
SELECT id, user_id, token, created_at, expires_at, updated_at FROM password_tokens
WHERE token=$1
`

func (q *Queries) GetUserToken(ctx context.Context, token string) (PasswordToken, error) {
	row := q.db.QueryRowContext(ctx, getUserToken, token)
	var i PasswordToken
	err := row.Scan(
		&i.ID,
		&i.UserID,
		&i.Token,
		&i.CreatedAt,
		&i.ExpiresAt,
		&i.UpdatedAt,
	)
	return i, err
}

const insertToken = `-- name: InsertToken :exec
INSERT INTO password_tokens(user_id, token, expires_at)
VALUES($1, $2, $3)
`

type InsertTokenParams struct {
	UserID    uuid.UUID
	Token     string
	ExpiresAt time.Time
}

func (q *Queries) InsertToken(ctx context.Context, arg InsertTokenParams) error {
	_, err := q.db.ExecContext(ctx, insertToken, arg.UserID, arg.Token, arg.ExpiresAt)
	return err
}

const updateUserPassword = `-- name: UpdateUserPassword :exec
UPDATE users
SET password_hash=$1
WHERE id=$2
`

type UpdateUserPasswordParams struct {
	PasswordHash string
	ID           uuid.UUID
}

func (q *Queries) UpdateUserPassword(ctx context.Context, arg UpdateUserPasswordParams) error {
	_, err := q.db.ExecContext(ctx, updateUserPassword, arg.PasswordHash, arg.ID)
	return err
}
