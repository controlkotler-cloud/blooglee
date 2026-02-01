-- Add scheduling columns to sites table
ALTER TABLE sites
ADD COLUMN publish_day_of_week integer,
ADD COLUMN publish_day_of_month integer,
ADD COLUMN publish_week_of_month integer,
ADD COLUMN publish_hour_utc integer DEFAULT 9;

-- Add constraints for valid ranges
ALTER TABLE sites
ADD CONSTRAINT check_day_of_week CHECK (publish_day_of_week IS NULL OR (publish_day_of_week >= 0 AND publish_day_of_week <= 6)),
ADD CONSTRAINT check_day_of_month CHECK (publish_day_of_month IS NULL OR (publish_day_of_month >= 1 AND publish_day_of_month <= 31)),
ADD CONSTRAINT check_week_of_month CHECK (publish_week_of_month IS NULL OR (publish_week_of_month >= 1 AND publish_week_of_month <= 4)),
ADD CONSTRAINT check_hour_utc CHECK (publish_hour_utc >= 0 AND publish_hour_utc <= 23);

-- Add comments for documentation
COMMENT ON COLUMN sites.publish_day_of_week IS '0-6 (Sunday-Saturday) for weekly/biweekly frequency';
COMMENT ON COLUMN sites.publish_day_of_month IS '1-31 for monthly frequency with fixed day';
COMMENT ON COLUMN sites.publish_week_of_month IS '1-4 for monthly frequency with specific week';
COMMENT ON COLUMN sites.publish_hour_utc IS '0-23 UTC hour for article generation';