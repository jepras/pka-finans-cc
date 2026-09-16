# Projekt-kontekst

## Hvad dette projekt simulerer

Arbejdet i dette Project simulerer en opgave i **PKA's finansafdeling**: afstemning af investeringsomkostninger. Teamet for investeringsomkostninger modtager kvartalsvise forvaltningshonorarer fra eksterne kapitalforvaltere og skal kontrollere, at det fakturerede beløb svarer til det, der er bogført internt.

Rollen du arbejder i: medarbejder i finansafdelingen, der skal kunne dokumentere, at hver enkelt fakturalinje er kontrolleret. Sporbarhed og kontrol vejer tungere end hastighed. Et tal, der ikke kan følges tilbage til et bilag, er ikke afstemt.

## Vigtigt: alle data er opdigtede

Der er **ingen rigtige PKA-data** i dette projekt. Modparten hedder **Nordic Capital Partners ApS**, som er en opfundet kapitalforvalter. Mandatnavne, beløb, honorarsatser, AUM, bilagsnumre, kontonumre og fakturanumre er konstrueret til workshoppen.

Afvigelserne i materialet er lagt ind med vilje, så der er noget at finde.

Læg aldrig rigtige PKA-data, kundedata eller interne bilag ind i dette projekt.

## Materialet

Datafilerne ligger i mappen `session1-chat/artifact-uploads/` og uploades direkte i det værktøj, du bygger. De skal ikke ligge i Project-konteksten:

| Fil | Indhold |
| --- | --- |
| `Faktura_NordicCapitalPartners_Q1_2026.pdf` | Forvalterfaktura for Q1 2026 |
| `PKA_bogforte_investeringsomkostninger.csv` | PKA's egen bogføring for Q1 2026, semikolon-separeret |

Hvordan de to filer er bygget op, står i [afstemnings-kontekst.md](afstemnings-kontekst.md).

## Sådan skal opgaven forstås

En linje er afstemt, når faktureret beløb og bogført beløb matcher på samme mandat i samme periode. Afvigelser skal frem i lyset, ikke bortforklares. En manglende bogføring er ikke en fejl i fakturaen, før den er undersøgt.
