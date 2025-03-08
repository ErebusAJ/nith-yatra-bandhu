-- +goose Up
CREATE TABLE guides (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    bio TEXT NOT NULL ,
    location TEXT NOT NULL,
    expertise TEXT NOT NULL,
    rating INT NOT NULL,
    hourly_rate DECIMAL(10,2) NOT NULL,
    available BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE TABLE guide_bookings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    guide_id UUID REFERENCES guides(id) ON DELETE CASCADE,
    group_id UUID REFERENCES travel_groups(id) ON DELETE CASCADE,
    status TEXT CHECK (status IN ('pending', 'accepted', 'rejected', 'completed')) DEFAULT 'pending',
    booked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE guide_booking_requests(
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    group_id UUID NOT NULL REFERENCES travel_groups(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    guide_id UUID NOT NULL REFERENCES guides(id) ON DELETE CASCADE,
    status TEXT NOT NULL CHECK (status IN ('pending', 'accepted', 'rejected')) DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- +goose Down
DROP TABLE guide_booking_requests;

DROP TABLE guide_bookings;

DROP TABLE guides;
