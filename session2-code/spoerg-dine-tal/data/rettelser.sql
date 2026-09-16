-- Rettelser til udtrækket. Filen køres ved opstart af appen og af kontrollen.
-- Databasen ændres aldrig. Alle rettelser laves som views herunder, så de kan læses og spores.
-- Alle spørgsmål og kontroller bruger transaktioner_renset, ikke transaktioner.

CREATE TEMP VIEW transaktioner_renset AS
SELECT * FROM transaktioner;
