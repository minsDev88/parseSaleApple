#NOW=$(date +"%Y%m")
NOW=$(date +%C%y%m -d -2days)
echo $NOW $(date)

/usr/local/bin/node /home/cdn/analytics/parseSaleApple/main.js
