#!/bin/bash

apt update && apt install -y tinyproxy
sed -i 's/Allow 127.0.0.1/Allow 0.0.0.0\/0/g' /etc/tinyproxy/tinyproxy.conf
echo "BasicAuth ${PROXY_USER} ${PROXY_PASSWORD}" >> /etc/tinyproxy/tinyproxy.conf
systemctl restart tinyproxy
