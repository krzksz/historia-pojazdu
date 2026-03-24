# Historia-Pojazdu

Prosty skrypt do sprawdzania poprawnej daty pierwszej rejestracji na podstawie danych z serwisu [HistoriaPojazdu.gov.pl](https://historiapojazdu.gov.pl/strona-glowna).

## Dlaczego?

Podczas szukania samochodu na portalach aukcyjnych częstą praktyką sprzedawców jest podawanie numeru rejestracyjnego oraz VIN. Niestety, aby uzyskać pełny raport historii pojazdu z polskiego rejestru (CEPiK), wymagane jest podanie dokładnej daty pierwszej rejestracji, która zazwyczaj nie jest udostępniana w ogłoszeniu. Ten skrypt pozwala odnaleźć tę datę, znając jedynie rok (np. na podstawie roku produkcji).

## Jak zacząć

Najprostszym sposobem na skorzystanie ze skryptu jest pobranie gotowego pliku wykonywalnego (executable) dla Twojego systemu operacyjnego ze strony **[GitHub Releases](https://github.com/krzksz/historia-pojazdu/releases)**.

### 1. Pobierz plik
Pobierz wersję odpowiednią dla Twojego systemu z sekcji **[Releases](https://github.com/krzksz/historia-pojazdu/releases)**.

### 2. Przygotowanie pliku (tylko macOS i Linux)
Otwórz Terminal w folderze, do którego pobrałeś plik, i wykonaj poniższe komendy:

* **macOS (zdjęcie blokady Apple i uprawnienia):**
    ```bash
    # Usuwa komunikat o "uszkodzonym pliku" (Gatekeeper)
    xattr -d com.apple.quarantine historia-pojazdu-macos-*
    
    # Nadaje uprawnienia do wykonywania
    chmod +x historia-pojazdu-macos-*
    ```

* **Linux (nadanie uprawnień):**
    ```bash
    chmod +x historia-pojazdu-linux-*
    ```

### 3. Uruchomienie programu

Aby program zadziałał poprawnie, musisz go wywołać z poziomu konsoli:

* **Windows:**
    Otwórz **PowerShell** lub **Wiersz Polecenia**, przeciągnij plik `.exe` do okna konsoli i naciśnij `Enter`.
    ```powershell
    .\historia-pojazdu-windows-amd64.exe
    ```

* **macOS / Linux:**
    Wpisz w terminalu ścieżkę do pliku, zaczynając od `./`:
    ```bash
    ./historia-pojazdu-macos-arm64
    ```
---

### Alternatywa: Uruchomienie z Bun (Dla programistów)

Jeśli masz zainstalowany [Bun](https://bun.sh), możesz uruchomić skrypt bezpośrednio z kodu źródłowego:

```bash
git clone https://github.com/krzksz/historia-pojazdu.git
cd historia-pojazdu
bun install
bun run start
```
