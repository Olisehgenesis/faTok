#!/bin/bash

# Check if Ion-SFU server is already running
check_ion_sfu() {
    if curl -s http://localhost:7000 > /dev/null 2>&1; then
        echo "✅ Ion-SFU server is already running on port 7000"
        return 0
    else
        echo "❌ Ion-SFU server is not running"
        return 1
    fi
}

# Start Ion-SFU server if not running
start_ion_sfu() {
    if ! check_ion_sfu; then
        echo "🚀 Starting Ion-SFU server..."
        cd ../ion-sfu && ./main -c config.toml &
        sleep 2
        
        # Verify it started
        if check_ion_sfu; then
            echo "✅ Ion-SFU server started successfully"
        else
            echo "❌ Failed to start Ion-SFU server"
            exit 1
        fi
    fi
}

# Main function
main() {
    echo "🔍 Checking Ion-SFU server status..."
    start_ion_sfu
    echo "🎯 Ion-SFU server is ready!"
}

# Run the check
main
