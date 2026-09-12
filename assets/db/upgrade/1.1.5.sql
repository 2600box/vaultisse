-- Upgrade to v1.1.5 - schema changes made on 2026-09-12.
-- Brings an already-installed database in line with the v1.1.5 databaseSchema.sql.
-- (New installs should use databaseSchema.sql directly and skip this file.)

-- Personal reading-progress tracking ("want to read" / "currently reading" /
-- "read"), independent of any physical stock's status - powers the new
-- Library nav filters, the dashboard's reading widgets, and the Goodreads
-- CSV import's "Exclusive Shelf" mapping.
ALTER TABLE books ADD COLUMN reading_status SMALLINT CHECK (reading_status IN (0, 1, 2));

INSERT INTO app_labels (language, code, text)
VALUES ('en', 'WANT_TO_READ', 'Want to read'),
       ('en', 'CURRENTLY_READING', 'Currently reading'),
       ('en', 'READ', 'Read'),
       ('en', 'READING_STATUS', 'Reading status'),
       ('en', 'DASHBOARD_TOTAL_READ', 'Books read'),
       ('en', 'DASHBOARD_NO_WANT_TO_READ', 'Your want-to-read list is empty'),
       ('en', 'DASHBOARD_NO_CURRENTLY_READING', 'You''re not currently reading anything'),

       ('ca', 'WANT_TO_READ', 'Per llegir'),
       ('ca', 'CURRENTLY_READING', 'Llegint ara'),
       ('ca', 'READ', 'Llegit'),
       ('ca', 'READING_STATUS', 'Estat de lectura'),
       ('ca', 'DASHBOARD_TOTAL_READ', 'Llibres llegits'),
       ('ca', 'DASHBOARD_NO_WANT_TO_READ', 'La teva llista de lectura pendent està buida'),
       ('ca', 'DASHBOARD_NO_CURRENTLY_READING', 'Ara mateix no estàs llegint res'),

       ('es', 'WANT_TO_READ', 'Por leer'),
       ('es', 'CURRENTLY_READING', 'Leyendo ahora'),
       ('es', 'READ', 'Leído'),
       ('es', 'READING_STATUS', 'Estado de lectura'),
       ('es', 'DASHBOARD_TOTAL_READ', 'Libros leídos'),
       ('es', 'DASHBOARD_NO_WANT_TO_READ', 'Tu lista de pendientes está vacía'),
       ('es', 'DASHBOARD_NO_CURRENTLY_READING', 'Ahora mismo no estás leyendo nada'),

       ('it', 'WANT_TO_READ', 'Da leggere'),
       ('it', 'CURRENTLY_READING', 'In lettura'),
       ('it', 'READ', 'Letto'),
       ('it', 'READING_STATUS', 'Stato di lettura'),
       ('it', 'DASHBOARD_TOTAL_READ', 'Libri letti'),
       ('it', 'DASHBOARD_NO_WANT_TO_READ', 'La tua lista di lettura è vuota'),
       ('it', 'DASHBOARD_NO_CURRENTLY_READING', 'Al momento non stai leggendo nulla');
