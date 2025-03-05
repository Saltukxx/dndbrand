@echo off
echo This script will temporarily disable Windows Firewall for testing purposes.
echo You should re-enable it after testing is complete.
echo.
echo Administrator privileges are required to modify firewall settings.
echo.
pause

echo Disabling Windows Firewall...
netsh advfirewall set allprofiles state off

echo.
echo Windows Firewall has been temporarily disabled.
echo Please test your application now.
echo.
echo Press any key to re-enable Windows Firewall when you're done testing.
pause

echo Re-enabling Windows Firewall...
netsh advfirewall set allprofiles state on

echo.
echo Windows Firewall has been re-enabled.
echo.
pause 