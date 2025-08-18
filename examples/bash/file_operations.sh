#!/bin/bash

# File Operations Script
# Provides various file and directory manipulation functions

main() {
    local operation="$1"
    shift
    
    case "$operation" in
        "backup")
            backup_files "$@"
            ;;
        "organize")
            organize_files "$@"
            ;;
        "find_duplicates")
            find_duplicates "$@"
            ;;
        "bulk_rename")
            bulk_rename "$@"
            ;;
        "size_report")
            size_report "$@"
            ;;
        "permissions")
            check_permissions "$@"
            ;;
        "compress")
            compress_files "$@"
            ;;
        "extract")
            extract_archive "$@"
            ;;
        "monitor")
            monitor_changes "$@"
            ;;
        "clean_temp")
            clean_temp_files "$@"
            ;;
        *)
            echo "{\"error\": \"Unknown operation: $operation\"}"
            echo "{\"available\": [\"backup\", \"organize\", \"find_duplicates\", \"bulk_rename\", \"size_report\", \"permissions\", \"compress\", \"extract\", \"monitor\", \"clean_temp\"]}"
            return 1
            ;;
    esac
}

backup_files() {
    local source_dir="${1:-.}"
    local backup_dir="${2:-./backups}"
    local timestamp=$(date +"%Y%m%d_%H%M%S")
    local backup_name="backup_${timestamp}"
    
    mkdir -p "$backup_dir"
    
    if [ -d "$source_dir" ]; then
        tar -czf "${backup_dir}/${backup_name}.tar.gz" -C "$source_dir" . 2>/dev/null
        local size=$(du -h "${backup_dir}/${backup_name}.tar.gz" | cut -f1)
        local file_count=$(find "$source_dir" -type f | wc -l)
        
        echo "{"
        echo "  \"success\": true,"
        echo "  \"backup_file\": \"${backup_dir}/${backup_name}.tar.gz\","
        echo "  \"size\": \"$size\","
        echo "  \"timestamp\": \"$timestamp\","
        echo "  \"files_backed_up\": $file_count"
        echo "}"
    else
        echo "{\"error\": \"Source directory not found: $source_dir\"}"
        return 1
    fi
}

organize_files() {
    local source_dir="${1:-.}"
    local organize_by="${2:-extension}"
    
    if [ ! -d "$source_dir" ]; then
        echo "{\"error\": \"Directory not found: $source_dir\"}"
        return 1
    fi
    
    local moved_count=0
    local created_dirs=""
    
    if [ "$organize_by" = "extension" ]; then
        for file in "$source_dir"/*.*; do
            [ -f "$file" ] || continue
            
            local extension="${file##*.}"
            local target_dir="$source_dir/$extension"
            
            mkdir -p "$target_dir"
            if [[ ! "$created_dirs" =~ "$extension" ]]; then
                created_dirs="$created_dirs $extension"
            fi
            
            mv "$file" "$target_dir/" 2>/dev/null && ((moved_count++))
        done
    elif [ "$organize_by" = "date" ]; then
        for file in "$source_dir"/*; do
            [ -f "$file" ] || continue
            
            local file_date=$(stat -f "%Sm" -t "%Y-%m" "$file" 2>/dev/null || stat -c "%y" "$file" 2>/dev/null | cut -d' ' -f1 | cut -d'-' -f1-2)
            local target_dir="$source_dir/$file_date"
            
            mkdir -p "$target_dir"
            if [[ ! "$created_dirs" =~ "$file_date" ]]; then
                created_dirs="$created_dirs $file_date"
            fi
            
            mv "$file" "$target_dir/" 2>/dev/null && ((moved_count++))
        done
    fi
    
    echo "{"
    echo "  \"success\": true,"
    echo "  \"organized_by\": \"$organize_by\","
    echo "  \"files_moved\": $moved_count,"
    echo "  \"directories_created\": \"$created_dirs\""
    echo "}"
}

find_duplicates() {
    local directory="${1:-.}"
    local check_type="${2:-name}"
    
    if [ ! -d "$directory" ]; then
        echo "{\"error\": \"Directory not found: $directory\"}"
        return 1
    fi
    
    local duplicates=""
    local count=0
    
    if [ "$check_type" = "name" ]; then
        # Find files with duplicate names
        find "$directory" -type f -exec basename {} \; | sort | uniq -d | while read filename; do
            local files=$(find "$directory" -type f -name "$filename" | tr '\n' ',')
            duplicates="${duplicates}{\"name\":\"$filename\",\"locations\":\"${files%,}\"},"
            ((count++))
        done
    elif [ "$check_type" = "size" ]; then
        # Find files with same size
        find "$directory" -type f -exec stat -f "%z %N" {} \; 2>/dev/null | sort -n | awk '{
            if (prev_size == $1 && prev_size != "") {
                print prev_file
                print $2
            }
            prev_size = $1
            prev_file = $2
        }' | while read file; do
            duplicates="${duplicates}\"$file\","
            ((count++))
        done
    fi
    
    echo "{"
    echo "  \"success\": true,"
    echo "  \"check_type\": \"$check_type\","
    echo "  \"duplicates_found\": $count,"
    echo "  \"duplicates\": [${duplicates%,}]"
    echo "}"
}

bulk_rename() {
    local directory="${1:-.}"
    local pattern="${2:-}"
    local replacement="${3:-}"
    
    if [ -z "$pattern" ] || [ -z "$replacement" ]; then
        echo "{\"error\": \"Pattern and replacement are required\"}"
        return 1
    fi
    
    if [ ! -d "$directory" ]; then
        echo "{\"error\": \"Directory not found: $directory\"}"
        return 1
    fi
    
    local renamed_count=0
    local renamed_files=""
    
    for file in "$directory"/*"$pattern"*; do
        [ -f "$file" ] || continue
        
        local basename=$(basename "$file")
        local newname="${basename//$pattern/$replacement}"
        local newpath="$directory/$newname"
        
        if [ "$file" != "$newpath" ]; then
            mv "$file" "$newpath" 2>/dev/null && {
                renamed_files="${renamed_files}{\"old\":\"$basename\",\"new\":\"$newname\"},"
                ((renamed_count++))
            }
        fi
    done
    
    echo "{"
    echo "  \"success\": true,"
    echo "  \"pattern\": \"$pattern\","
    echo "  \"replacement\": \"$replacement\","
    echo "  \"files_renamed\": $renamed_count,"
    echo "  \"renamed\": [${renamed_files%,}]"
    echo "}"
}

size_report() {
    local directory="${1:-.}"
    local sort_by="${2:-size}"
    
    if [ ! -d "$directory" ]; then
        echo "{\"error\": \"Directory not found: $directory\"}"
        return 1
    fi
    
    local total_size=$(du -sh "$directory" 2>/dev/null | cut -f1)
    local file_count=$(find "$directory" -type f | wc -l)
    local dir_count=$(find "$directory" -type d | wc -l)
    
    # Get largest files
    local largest_files=""
    if [ "$sort_by" = "size" ]; then
        largest_files=$(find "$directory" -type f -exec du -h {} \; 2>/dev/null | sort -rh | head -10 | while read size file; do
            echo "{\"file\":\"${file#$directory/}\",\"size\":\"$size\"},"
        done)
    fi
    
    # Get directory sizes
    local dir_sizes=""
    for dir in "$directory"/*/; do
        [ -d "$dir" ] || continue
        local dir_size=$(du -sh "$dir" 2>/dev/null | cut -f1)
        local dir_name=$(basename "$dir")
        dir_sizes="${dir_sizes}{\"directory\":\"$dir_name\",\"size\":\"$dir_size\"},"
    done
    
    echo "{"
    echo "  \"success\": true,"
    echo "  \"total_size\": \"$total_size\","
    echo "  \"file_count\": $file_count,"
    echo "  \"directory_count\": $dir_count,"
    echo "  \"largest_files\": [${largest_files%,}],"
    echo "  \"subdirectory_sizes\": [${dir_sizes%,}]"
    echo "}"
}

check_permissions() {
    local path="${1:-.}"
    local check_recursive="${2:-false}"
    
    if [ ! -e "$path" ]; then
        echo "{\"error\": \"Path not found: $path\"}"
        return 1
    fi
    
    local issues=""
    local issue_count=0
    
    # Check for world-writable files
    if [ "$check_recursive" = "true" ] && [ -d "$path" ]; then
        find "$path" -type f -perm -002 2>/dev/null | while read file; do
            issues="${issues}{\"file\":\"$file\",\"issue\":\"world-writable\"},"
            ((issue_count++))
        done
        
        # Check for files without owner read permission
        find "$path" -type f ! -perm -400 2>/dev/null | while read file; do
            issues="${issues}{\"file\":\"$file\",\"issue\":\"no-owner-read\"},"
            ((issue_count++))
        done
    else
        # Single file check
        local perms=$(stat -f "%Sp" "$path" 2>/dev/null || stat -c "%a" "$path" 2>/dev/null)
        local owner=$(stat -f "%Su" "$path" 2>/dev/null || stat -c "%U" "$path" 2>/dev/null)
        local group=$(stat -f "%Sg" "$path" 2>/dev/null || stat -c "%G" "$path" 2>/dev/null)
        
        echo "{"
        echo "  \"success\": true,"
        echo "  \"path\": \"$path\","
        echo "  \"permissions\": \"$perms\","
        echo "  \"owner\": \"$owner\","
        echo "  \"group\": \"$group\","
        echo "  \"is_readable\": $([ -r "$path" ] && echo "true" || echo "false"),"
        echo "  \"is_writable\": $([ -w "$path" ] && echo "true" || echo "false"),"
        echo "  \"is_executable\": $([ -x "$path" ] && echo "true" || echo "false")"
        echo "}"
        return 0
    fi
    
    echo "{"
    echo "  \"success\": true,"
    echo "  \"path\": \"$path\","
    echo "  \"issues_found\": $issue_count,"
    echo "  \"issues\": [${issues%,}]"
    echo "}"
}

compress_files() {
    local source="${1:-.}"
    local output="${2:-archive.tar.gz}"
    local compression="${3:-gzip}"
    
    if [ ! -e "$source" ]; then
        echo "{\"error\": \"Source not found: $source\"}"
        return 1
    fi
    
    local original_size=$(du -sh "$source" 2>/dev/null | cut -f1)
    local start_time=$(date +%s)
    
    case "$compression" in
        "gzip")
            tar -czf "$output" "$source" 2>/dev/null
            ;;
        "bzip2")
            tar -cjf "$output" "$source" 2>/dev/null
            ;;
        "xz")
            tar -cJf "$output" "$source" 2>/dev/null
            ;;
        "zip")
            zip -r "$output" "$source" >/dev/null 2>&1
            ;;
        *)
            echo "{\"error\": \"Unknown compression type: $compression\"}"
            return 1
            ;;
    esac
    
    local end_time=$(date +%s)
    local duration=$((end_time - start_time))
    local compressed_size=$(du -h "$output" 2>/dev/null | cut -f1)
    
    echo "{"
    echo "  \"success\": true,"
    echo "  \"output_file\": \"$output\","
    echo "  \"compression_type\": \"$compression\","
    echo "  \"original_size\": \"$original_size\","
    echo "  \"compressed_size\": \"$compressed_size\","
    echo "  \"duration_seconds\": $duration"
    echo "}"
}

extract_archive() {
    local archive="$1"
    local destination="${2:-.}"
    
    if [ ! -f "$archive" ]; then
        echo "{\"error\": \"Archive not found: $archive\"}"
        return 1
    fi
    
    mkdir -p "$destination"
    local file_count_before=$(find "$destination" -type f | wc -l)
    
    case "$archive" in
        *.tar.gz|*.tgz)
            tar -xzf "$archive" -C "$destination" 2>/dev/null
            ;;
        *.tar.bz2|*.tbz2)
            tar -xjf "$archive" -C "$destination" 2>/dev/null
            ;;
        *.tar.xz|*.txz)
            tar -xJf "$archive" -C "$destination" 2>/dev/null
            ;;
        *.zip)
            unzip -q "$archive" -d "$destination" 2>/dev/null
            ;;
        *.tar)
            tar -xf "$archive" -C "$destination" 2>/dev/null
            ;;
        *)
            echo "{\"error\": \"Unknown archive format: $archive\"}"
            return 1
            ;;
    esac
    
    local file_count_after=$(find "$destination" -type f | wc -l)
    local extracted_count=$((file_count_after - file_count_before))
    
    echo "{"
    echo "  \"success\": true,"
    echo "  \"archive\": \"$archive\","
    echo "  \"destination\": \"$destination\","
    echo "  \"files_extracted\": $extracted_count"
    echo "}"
}

monitor_changes() {
    local directory="${1:-.}"
    local duration="${2:-10}"
    
    if [ ! -d "$directory" ]; then
        echo "{\"error\": \"Directory not found: $directory\"}"
        return 1
    fi
    
    # Take initial snapshot
    local temp_file="/tmp/monitor_$$"
    find "$directory" -type f -exec stat -f "%m %N" {} \; > "$temp_file" 2>/dev/null
    
    echo "{"
    echo "  \"monitoring\": \"$directory\","
    echo "  \"duration\": $duration,"
    echo "  \"start_time\": \"$(date)\","
    
    sleep "$duration"
    
    # Check for changes
    local changes=""
    local change_count=0
    
    find "$directory" -type f -exec stat -f "%m %N" {} \; 2>/dev/null | while read mtime file; do
        local old_mtime=$(grep " $file$" "$temp_file" | cut -d' ' -f1)
        if [ "$old_mtime" != "$mtime" ]; then
            changes="${changes}\"$file\","
            ((change_count++))
        fi
    done
    
    rm -f "$temp_file"
    
    echo "  \"end_time\": \"$(date)\","
    echo "  \"changes_detected\": $change_count,"
    echo "  \"changed_files\": [${changes%,}]"
    echo "}"
}

clean_temp_files() {
    local directory="${1:-.}"
    local age_days="${2:-7}"
    local dry_run="${3:-false}"
    
    if [ ! -d "$directory" ]; then
        echo "{\"error\": \"Directory not found: $directory\"}"
        return 1
    fi
    
    # Find temp files (common patterns)
    local temp_patterns="*.tmp *.temp *.cache *.bak *~ .DS_Store"
    local files_to_clean=""
    local total_size=0
    local file_count=0
    
    for pattern in $temp_patterns; do
        find "$directory" -name "$pattern" -type f -mtime +"$age_days" 2>/dev/null | while read file; do
            local size=$(stat -f "%z" "$file" 2>/dev/null || stat -c "%s" "$file" 2>/dev/null)
            total_size=$((total_size + size))
            files_to_clean="${files_to_clean}\"${file#$directory/}\","
            ((file_count++))
            
            if [ "$dry_run" = "false" ]; then
                rm -f "$file"
            fi
        done
    done
    
    # Convert size to human readable
    local human_size=""
    if [ $total_size -gt 1073741824 ]; then
        human_size="$((total_size / 1073741824))GB"
    elif [ $total_size -gt 1048576 ]; then
        human_size="$((total_size / 1048576))MB"
    elif [ $total_size -gt 1024 ]; then
        human_size="$((total_size / 1024))KB"
    else
        human_size="${total_size}B"
    fi
    
    echo "{"
    echo "  \"success\": true,"
    echo "  \"directory\": \"$directory\","
    echo "  \"age_days\": $age_days,"
    echo "  \"dry_run\": $dry_run,"
    echo "  \"files_cleaned\": $file_count,"
    echo "  \"space_freed\": \"$human_size\","
    echo "  \"files\": [${files_to_clean%,}]"
    echo "}"
}

# Execute main function with all arguments
main "$@"