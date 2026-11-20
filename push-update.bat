@echo off
rem Applies aurelia-update.zip to this repo, commits it and pushes it to the ASSETS branch.
cd /d "%~dp0"

echo === 1/5 Getting the latest ASSETS branch ===
git pull --ff-only origin ASSETS || goto :fail

echo === 2/5 Unpacking the update ===
tar -xf aurelia-update.zip || goto :fail

echo === 3/5 Removing the old frame folders ===
git rm -r -q --ignore-unmatch frontend/public/media/lift frontend/public/media/rooftop frontend/public/media/rooms || goto :fail

echo === 4/5 Committing ===
git add frontend tools README.md || goto :fail
git -c user.name="Dhanancheyan43" -c user.email="msdv2010@gmail.com" commit -F commit-message.txt || goto :fail

echo === 5/5 Pushing to ASSETS ===
git push origin HEAD:ASSETS || goto :fail

del aurelia-update.zip commit-message.txt
echo.
echo DONE - the update is on the ASSETS branch.
pause
exit /b 0

:fail
echo.
echo STOPPED - the step above failed and nothing after it was run.
echo Copy the text in this window and send it to Claude.
pause
exit /b 1
