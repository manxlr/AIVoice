@echo off
setlocal

echo ===============================================
echo   AI Voice Assistant Model Downloader (Windows)
echo ===============================================

rem Resolve target directory (directory of this script)
set "TARGET_DIR=%~dp0"
if "%TARGET_DIR:~-1%"=="\" set "TARGET_DIR=%TARGET_DIR:~0,-1%"

echo Target directory: %TARGET_DIR%

rem Ensure Piper directory exists
if not exist "%TARGET_DIR%\piper" (
    echo Creating Piper directory...
    mkdir "%TARGET_DIR%\piper"
    if errorlevel 1 goto :error
)

rem Download faster-whisper base model into faster-whisper\ directory
echo.
echo Downloading faster-whisper base model (may take a few minutes)...
python -c "import pathlib; from faster_whisper import WhisperModel; root = pathlib.Path(r'%TARGET_DIR%') / 'faster-whisper'; root.mkdir(parents=True, exist_ok=True); WhisperModel('base', download_root=str(root))" 
if errorlevel 1 goto :error

call :download_voice en_US-amy-medium.onnx ^
    https://huggingface.co/rhasspy/piper-voices/resolve/v1.0.0/en/en_US/amy/medium/en_US-amy-medium.onnx
if errorlevel 1 goto :error

call :download_voice en_US-ryan-medium.onnx ^
    https://huggingface.co/rhasspy/piper-voices/resolve/v1.0.0/en/en_US/ryan/medium/en_US-ryan-medium.onnx
if errorlevel 1 goto :error

call :download_voice en_US-lessac-high.onnx ^
    https://huggingface.co/rhasspy/piper-voices/resolve/v1.0.0/en/en_US/lessac/high/en_US-lessac-high.onnx
if errorlevel 1 goto :error

call :download_voice en_US-kathleen-low.onnx ^
    https://huggingface.co/rhasspy/piper-voices/resolve/v1.0.0/en/en_US/kathleen/low/en_US-kathleen-low.onnx
if errorlevel 1 goto :error

call :download_voice en_US-joe-medium.onnx ^
    https://huggingface.co/rhasspy/piper-voices/resolve/v1.0.0/en/en_US/joe/medium/en_US-joe-medium.onnx
if errorlevel 1 goto :error

call :download_voice en_US-danny-low.onnx ^
    https://huggingface.co/rhasspy/piper-voices/resolve/v1.0.0/en/en_US/danny/low/en_US-danny-low.onnx
if errorlevel 1 goto :error

echo.
echo Downloads complete!
echo - faster-whisper model: %TARGET_DIR%\faster-whisper
echo - Piper voices: %TARGET_DIR%\piper

goto :eof

:download_voice
setlocal
set "FILE_NAME=%~1"
set "VOICE_URL=%~2"

if exist "%TARGET_DIR%\piper\%FILE_NAME%" (
    echo Voice %FILE_NAME% already present, skipping.
) else (
    echo.
    echo Downloading Piper voice %FILE_NAME%...
    curl.exe -L "%VOICE_URL%" -o "%TARGET_DIR%\piper\%FILE_NAME%"
    if errorlevel 1 (
        endlocal & exit /b 1
    )
)
endlocal
exit /b 0

:error
echo.
echo [ERROR] Download failed. Check the messages above for details.
exit /b 1

