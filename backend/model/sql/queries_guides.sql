-- name: AddGuide :exec
INSERT INTO guides(name, bio, location, expertise, rating, hourly_rate)
VALUES($1, $2, $3, $4, $5, $6);

-- name: UpdateGuideAvail :exec
UPDATE guides 
SET available=$1
WHERE id=$2;

-- name: BookGuide :exec
INSERT INTO guide_bookings(guide_id, group_id, status)
VALUES($1, $2, $3);

-- name: GetGuideDetails :many
SELECT * FROM guides
WHERE location=$1 AND available=TRUE;

-- name: SendGuideRequest :exec
INSERT INTO guide_booking_requests(group_id, user_id, guide_id)
VALUES($1, $2, $3);

-- name: UpdateGuideRequest :exec
UPDATE guide_booking_requests 
SET status=$1
WHERE group_id=$1 AND guide_id=$2;

-- name: RejectGuideRequest :exec
DELETE FROM guide_booking_requests
WHERE guide_id=$1 AND group_id=$2;
