DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_class WHERE relname = 'project_code_seq') THEN
    CREATE SEQUENCE project_code_seq START WITH 1 INCREMENT BY 1;
  END IF;
END$$;


UPDATE "Project"
SET "code" = 'PRJ-' || LPAD(nextval('project_code_seq')::text, 4, '0')
WHERE "code" IS NULL;


UPDATE "Project"
SET "updatedAt" = COALESCE("updatedAt", "createdAt", NOW())
WHERE "updatedAt" IS NULL;
