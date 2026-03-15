# Historia-Pojazdu

Prosty skrypt do sprawdzania poprawnej daty pierwszej rejestracji na podstawie danych z serwisu [HistoriaPojazdu.gov.pl](https://historiapojazdu.gov.pl/strona-glowna).

## Dlaczego?

Podczas szukania samochodu na portalach aukcyjnych częstą praktyką sprzedawców jest podawanie numeru rejestracyjnego oraz VIN. Niestety, aby uzyskać pełny raport historii pojazdu z polskiego rejestru (CEPiK), wymagane jest podanie dokładnej daty pierwszej rejestracji, która zazwyczaj nie jest udostępniana w ogłoszeniu. Ten skrypt pozwala odnaleźć tę datę, znając jedynie rok (np. na podstawie roku produkcji).

## Jak zacząć

Najprostszym sposobem na skorzystanie ze skryptu jest pobranie gotowego pliku wykonywalnego (executable) dla Twojego systemu operacyjnego ze strony **[GitHub Releases](https://github.com/krzksz/historia-pojazdu/releases)**.

1. Pobierz plik odpowiedni dla Twojego systemu (Windows, Linux lub macOS).
2. (Linux/macOS) Nadaj uprawnienia do wykonywania: `chmod +x historia-pojazdu-*`.
3. Uruchom go w terminalu!

Korzystanie z tych plików nie wymaga instalacji Node.js ani Bun.

---

### Alternatywa: Uruchomienie z Bun (Dla programistów)

Jeśli masz zainstalowany [Bun](https://bun.sh), możesz uruchomić skrypt bezpośrednio z kodu źródłowego:

```bash
git clone https://github.com/krzksz/historia-pojazdu.git
cd historia-pojazdu
bun install
bun run start
```
