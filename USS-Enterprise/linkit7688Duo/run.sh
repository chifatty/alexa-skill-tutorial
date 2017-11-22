#!/bin/bash

ps | grep "/usr/bin/node /root/Projects/light002/index.js" | grep -v "grep" >/dev/null

if [ $? -ne 0 ]
    then
    echo `date`: "program is not running."
    /usr/bin/node /root/Projects/light002/index.js 2>&1  > /dev/null
    echo `date`: "launch program."
else
    echo `date`: "program is running."
fi

