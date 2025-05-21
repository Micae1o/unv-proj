DROP FUNCTION IF EXISTS get_active_employees_in_month(integer, integer);
CREATE OR REPLACE FUNCTION get_active_employees_in_month(year_param INT, month_param INT)
RETURNS TABLE (
    id INTEGER,
    name VARCHAR,
    email VARCHAR,
    start_date DATE,
    end_date DATE
) AS $$
DECLARE
    first_day DATE := make_date(year_param, month_param + 1, 1);
    last_day DATE := (first_day + INTERVAL '1 month - 1 day')::DATE;
BEGIN
    RETURN QUERY
    SELECT 
        e.id, 
        e.name, 
        e.email, 
        e.start_date, 
        e.end_date
    FROM 
        employees e
    WHERE 
        e.start_date <= last_day AND
        (e.end_date IS NULL OR e.end_date >= first_day)
    ORDER BY 
        e.name;
END;
$$ LANGUAGE plpgsql;

DROP FUNCTION IF EXISTS get_employee_hours_in_month(integer, integer, integer);
CREATE OR REPLACE FUNCTION get_employee_hours_in_month(employee_id_param INT, year_param INT, month_param INT)
RETURNS TABLE (
    day INT,
    hours FLOAT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        tr.day,
        tr.hours
    FROM 
        time_records tr
    WHERE 
        tr.employee_id = employee_id_param AND
        tr.year = year_param AND
        tr.month = month_param
    ORDER BY 
        tr.day;
END;
$$ LANGUAGE plpgsql;

-- Function to calculate the total hours worked by an employee in a month
DROP FUNCTION IF EXISTS calculate_total_hours(integer, integer, integer);
CREATE OR REPLACE FUNCTION calculate_total_hours(employee_id_param INT, year_param INT, month_param INT)
RETURNS FLOAT AS $$
DECLARE
    total_hours FLOAT;
BEGIN
    SELECT COALESCE(SUM(hours), 0) INTO total_hours
    FROM time_records
    WHERE 
        employee_id = employee_id_param AND
        year = year_param AND
        month = month_param;
    
    RETURN total_hours;
END;
$$ LANGUAGE plpgsql;

-- Function to update time records with validation
DROP FUNCTION IF EXISTS update_time_record(integer, integer, integer, integer, float) CASCADE;
CREATE OR REPLACE FUNCTION update_time_record(
    employee_id_param INT,
    year_param INT,
    month_param INT,
    day_param INT,
    hours_param FLOAT
)
RETURNS TABLE (
    success BOOLEAN,
    error_message TEXT
) AS $$
DECLARE
    is_weekend BOOLEAN;
    first_day DATE := make_date(year_param, month_param + 1, 1);
    record_day DATE := make_date(year_param, month_param + 1, day_param);
    employee_exists BOOLEAN;
    employee_end_date DATE;
    debug_msg TEXT;
    existing_record BOOLEAN;
BEGIN
    -- Debug info
    RAISE NOTICE 'Updating time record: employee %, year %, month %, day %, hours %', 
                 employee_id_param, year_param, month_param, day_param, hours_param;
    RAISE NOTICE 'Record date calculated as: %', record_day;
    
    -- Check if employee exists
    SELECT EXISTS(SELECT 1 FROM employees WHERE id = employee_id_param) INTO employee_exists;
    IF NOT employee_exists THEN
        debug_msg := 'Employee with ID ' || employee_id_param || ' does not exist';
        RAISE NOTICE '%', debug_msg;
        RETURN QUERY SELECT FALSE, debug_msg;
        RETURN;
    END IF;

    -- Check date validity
    IF record_day < first_day OR record_day >= first_day + INTERVAL '1 month' THEN
        debug_msg := 'Invalid date: year ' || year_param || ', month ' || month_param || ', day ' || day_param;
        RAISE NOTICE '%', debug_msg;
        RETURN QUERY SELECT FALSE, debug_msg;
        RETURN;
    END IF;

    -- Get employee end_date and check if the record_day is valid
    SELECT end_date INTO employee_end_date FROM employees WHERE id = employee_id_param;
    IF employee_end_date IS NOT NULL AND record_day > employee_end_date THEN
        debug_msg := 'Cannot record hours after employee termination date: ' || employee_end_date;
        RAISE NOTICE '%', debug_msg;
        RETURN QUERY SELECT FALSE, debug_msg;
        RETURN;
    END IF;

    -- Check if weekend
    is_weekend := EXTRACT(DOW FROM record_day) IN (0, 6); -- 0=Sunday, 6=Saturday
    RAISE NOTICE 'Is weekend: %', is_weekend;
    
    -- Only 0 hours allowed for weekends
    IF is_weekend AND hours_param > 0 THEN
        debug_msg := 'Cannot record hours for weekend days';
        RAISE NOTICE '%', debug_msg;
        RETURN QUERY SELECT FALSE, debug_msg;
        RETURN;
    END IF;
    
    -- Check hours range
    IF hours_param < 0 OR hours_param > 12 THEN
        debug_msg := 'Invalid hours: ' || hours_param || '. Must be between 0 and 12';
        RAISE NOTICE '%', debug_msg;
        RETURN QUERY SELECT FALSE, debug_msg;
        RETURN;
    END IF;
    
    -- Check if record already exists
    SELECT EXISTS(
        SELECT 1 FROM time_records 
        WHERE employee_id = employee_id_param 
          AND year = year_param 
          AND month = month_param 
          AND day = day_param
    ) INTO existing_record;
    
    -- Update or insert record
    BEGIN
        IF existing_record THEN
            -- Update existing record
            UPDATE time_records
            SET hours = hours_param,
                updated_at = NOW()
            WHERE employee_id = employee_id_param
              AND year = year_param
              AND month = month_param
              AND day = day_param;
            
            RAISE NOTICE 'Existing time record updated successfully';
        ELSE
            -- Insert new record
            INSERT INTO time_records (
                employee_id, year, month, day, hours, created_at, updated_at
            ) VALUES (
                employee_id_param, year_param, month_param, day_param, 
                hours_param, NOW(), NOW()
            );
            
            RAISE NOTICE 'New time record created successfully';
        END IF;
        
        RETURN QUERY SELECT TRUE, NULL;
    EXCEPTION
        WHEN OTHERS THEN
            debug_msg := 'Failed to insert/update time record: ' || SQLERRM;
            RAISE NOTICE '%', debug_msg;
            RETURN QUERY SELECT FALSE, debug_msg;
    END;
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Error in update_time_record: %', SQLERRM;
        RETURN QUERY SELECT FALSE, SQLERRM;
END;
$$ LANGUAGE plpgsql;

-- Function to get monthly hours summary for all employees
-- First drop the function to avoid type change errors
DROP FUNCTION IF EXISTS get_monthly_hours_summary(integer, integer);

CREATE OR REPLACE FUNCTION get_monthly_hours_summary(year_param INT, month_param INT)
RETURNS TABLE (
    employee_id INT,
    employee_name VARCHAR,
    total_hours FLOAT,
    working_days BIGINT
) AS $$
BEGIN
    RETURN QUERY
    WITH active_employees AS (
        SELECT id, name FROM get_active_employees_in_month(year_param, month_param)
    ),
    employee_records AS (
        SELECT 
            tr.employee_id,
            COUNT(tr.day) FILTER (WHERE tr.hours > 0) AS working_days,
            COALESCE(SUM(tr.hours), 0) AS total_hours
        FROM 
            time_records tr
        WHERE 
            tr.year = year_param AND
            tr.month = month_param
        GROUP BY 
            tr.employee_id
    )
    SELECT 
        ae.id AS employee_id,
        ae.name AS employee_name,
        COALESCE(er.total_hours, 0) AS total_hours,
        COALESCE(er.working_days, 0) AS working_days
    FROM 
        active_employees ae
    LEFT JOIN 
        employee_records er ON ae.id = er.employee_id
    ORDER BY 
        ae.name;
END;
$$ LANGUAGE plpgsql;

-- Trigger function to validate time records before insert/update
DROP FUNCTION IF EXISTS validate_time_record() CASCADE;
CREATE OR REPLACE FUNCTION validate_time_record()
RETURNS TRIGGER AS $$
DECLARE
    record_day DATE;
    is_weekend BOOLEAN;
    employee_end_date DATE;
BEGIN
    -- Create date from record
    record_day := make_date(NEW.year, NEW.month + 1, NEW.day);
    
    -- Check if weekend
    is_weekend := EXTRACT(DOW FROM record_day) IN (0, 6); -- 0=Sunday, 6=Saturday
    
    -- Weekend validation
    IF is_weekend AND NEW.hours > 0 THEN
        RAISE EXCEPTION 'Cannot record hours for weekend days';
    END IF;
    
    -- Hours range validation
    IF NEW.hours < 0 OR NEW.hours > 12 THEN
        RAISE EXCEPTION 'Invalid hours: %. Must be between 0 and 12', NEW.hours;
    END IF;
    
    -- Check if employee terminated and record date is after termination
    SELECT end_date INTO employee_end_date FROM employees WHERE id = NEW.employee_id;
    IF employee_end_date IS NOT NULL AND record_day > employee_end_date THEN
        RAISE EXCEPTION 'Cannot record hours after employee termination date: %', employee_end_date;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
DROP TRIGGER IF EXISTS time_record_validation_trigger ON time_records;
CREATE TRIGGER time_record_validation_trigger
BEFORE INSERT OR UPDATE ON time_records
FOR EACH ROW
EXECUTE FUNCTION validate_time_record();

-- Function to get only active employees with worked hours in a specific month
DROP FUNCTION IF EXISTS get_active_employees_with_hours(integer, integer);
CREATE OR REPLACE FUNCTION get_active_employees_with_hours(year_param INT, month_param INT)
RETURNS TABLE (
    id INTEGER,
    name VARCHAR,
    email VARCHAR,
    total_hours FLOAT,
    working_days BIGINT
) AS $$
BEGIN
    RETURN QUERY
    WITH active_employees AS (
        SELECT e.id, e.name, e.email 
        FROM get_active_employees_in_month(year_param, month_param) e
    ),
    employee_records AS (
        SELECT 
            tr.employee_id,
            COUNT(tr.day) FILTER (WHERE tr.hours > 0) AS working_days,
            COALESCE(SUM(tr.hours), 0) AS total_hours
        FROM 
            time_records tr
        WHERE 
            tr.year = year_param AND
            tr.month = month_param
        GROUP BY 
            tr.employee_id
    )
    SELECT 
        ae.id,
        ae.name,
        ae.email,
        COALESCE(er.total_hours, 0) AS total_hours,
        COALESCE(er.working_days, 0) AS working_days
    FROM 
        active_employees ae
    INNER JOIN 
        employee_records er ON ae.id = er.employee_id
    WHERE 
        er.working_days > 0
    ORDER BY 
        ae.name;
END;
$$ LANGUAGE plpgsql; 