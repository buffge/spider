#!/bin/bash

# 定义起始值和执行次数
START_UID=1001
DELAY=7200.0
COUNT=10  # 执行的次数，可以根据需要修改

# 循环执行命令
for ((i=0; i<COUNT; i++)); do
    S_UID=$((START_UID + i))
    DELAY=$(echo "scale=1; $DELAY + 0.01" | bc)
    echo "启动实例: UID=$S_UID, DELAY_TS=$DELAY"
    HL=1 DELAY_TS=$DELAY XMMX_UID=$S_UID nohup yarn start > "./logs/$S_UID.log" 2>&1 &
    # sleep 1
done

echo "所有实例已启动"
