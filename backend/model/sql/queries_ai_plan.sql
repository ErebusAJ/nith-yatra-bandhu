-- name: SavePlan :exec
INSERT INTO ai_plan(user_id, raw_data)
VALUES($1, $2);

-- name: RetreivePlan :one
SELECT * FROM ai_plan
WHERE user_id=$1;