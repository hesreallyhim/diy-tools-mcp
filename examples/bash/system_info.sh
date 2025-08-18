#!/bin/bash

# System Information Gatherer
# Collects various system metrics and information

main() {
    # Parse optional argument for info type
    local info_type="${1:-all}"
    
    case "$info_type" in
        "all")
            get_all_info
            ;;
        "basic")
            get_basic_info
            ;;
        "memory")
            get_memory_info
            ;;
        "disk")
            get_disk_info
            ;;
        "network")
            get_network_info
            ;;
        *)
            echo "{\"error\": \"Unknown info type: $info_type\", \"available\": [\"all\", \"basic\", \"memory\", \"disk\", \"network\"]}"
            ;;
    esac
}

get_basic_info() {
    echo "{"
    echo "  \"hostname\": \"$(hostname)\","
    echo "  \"user\": \"$(whoami)\","
    echo "  \"os\": \"$(uname -s)\","
    echo "  \"kernel\": \"$(uname -r)\","
    echo "  \"arch\": \"$(uname -m)\","
    echo "  \"uptime\": \"$(uptime | sed 's/,/;/g')\","
    echo "  \"date\": \"$(date -u +%Y-%m-%dT%H:%M:%SZ)\""
    echo "}"
}

get_memory_info() {
    if [[ "$OSTYPE" == "darwin"* ]]; then
        # macOS
        local total_mem=$(sysctl -n hw.memsize | awk '{print $1/1024/1024/1024}')
        local page_size=$(pagesize)
        local vm_stat=$(vm_stat)
        local free_pages=$(echo "$vm_stat" | grep "Pages free" | awk '{print $3}' | sed 's/\.//')
        local free_mem=$(echo "$free_pages * $page_size / 1024 / 1024 / 1024" | bc)
        
        echo "{"
        echo "  \"total_gb\": $total_mem,"
        echo "  \"free_gb\": $free_mem,"
        echo "  \"platform\": \"macos\""
        echo "}"
    else
        # Linux
        local mem_info=$(free -b | grep Mem)
        local total=$(echo $mem_info | awk '{print $2/1024/1024/1024}')
        local used=$(echo $mem_info | awk '{print $3/1024/1024/1024}')
        local free=$(echo $mem_info | awk '{print $4/1024/1024/1024}')
        
        echo "{"
        echo "  \"total_gb\": $total,"
        echo "  \"used_gb\": $used,"
        echo "  \"free_gb\": $free,"
        echo "  \"platform\": \"linux\""
        echo "}"
    fi
}

get_disk_info() {
    echo "{"
    echo "  \"filesystems\": ["
    
    local first=true
    df -h | tail -n +2 | while read line; do
        local filesystem=$(echo $line | awk '{print $1}')
        local size=$(echo $line | awk '{print $2}')
        local used=$(echo $line | awk '{print $3}')
        local avail=$(echo $line | awk '{print $4}')
        local use_percent=$(echo $line | awk '{print $5}')
        local mount=$(echo $line | awk '{print $6}')
        
        if [ "$first" = false ]; then
            echo ","
        fi
        first=false
        
        echo -n "    {"
        echo -n "\"filesystem\": \"$filesystem\", "
        echo -n "\"size\": \"$size\", "
        echo -n "\"used\": \"$used\", "
        echo -n "\"available\": \"$avail\", "
        echo -n "\"use_percent\": \"$use_percent\", "
        echo -n "\"mount\": \"$mount\""
        echo -n "}"
    done
    
    echo ""
    echo "  ]"
    echo "}"
}

get_network_info() {
    echo "{"
    echo "  \"interfaces\": ["
    
    local first=true
    if [[ "$OSTYPE" == "darwin"* ]]; then
        # macOS
        for interface in $(ifconfig -l); do
            local ip=$(ifconfig $interface | grep "inet " | awk '{print $2}')
            if [ ! -z "$ip" ]; then
                if [ "$first" = false ]; then
                    echo ","
                fi
                first=false
                echo -n "    {\"name\": \"$interface\", \"ip\": \"$ip\"}"
            fi
        done
    else
        # Linux
        for interface in $(ip -o link show | awk -F': ' '{print $2}'); do
            local ip=$(ip -4 addr show $interface | grep -oP '(?<=inet\s)\d+(\.\d+){3}')
            if [ ! -z "$ip" ]; then
                if [ "$first" = false ]; then
                    echo ","
                fi
                first=false
                echo -n "    {\"name\": \"$interface\", \"ip\": \"$ip\"}"
            fi
        done
    fi
    
    echo ""
    echo "  ]"
    echo "}"
}

get_all_info() {
    echo "{"
    echo "  \"basic\": $(get_basic_info),"
    echo "  \"memory\": $(get_memory_info),"
    echo "  \"disk\": $(get_disk_info),"
    echo "  \"network\": $(get_network_info)"
    echo "}"
}