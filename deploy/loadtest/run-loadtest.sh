#!/bin/bash

################################################################################
# Kaizen Studio Load Testing Script
#
# Runs k6 load tests with proper configuration and reporting.
#
# Usage:
#   ./run-loadtest.sh [test_type] [environment]
#
# Examples:
#   ./run-loadtest.sh smoke development
#   ./run-loadtest.sh stress staging
#   ./run-loadtest.sh all staging
################################################################################

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPORTS_DIR="${SCRIPT_DIR}/reports"

# Create reports directory
mkdir -p "${REPORTS_DIR}"

################################################################################
# Functions
################################################################################

print_header() {
  echo -e "${BLUE}============================================${NC}"
  echo -e "${BLUE}$1${NC}"
  echo -e "${BLUE}============================================${NC}"
}

print_success() {
  echo -e "${GREEN}✓ $1${NC}"
}

print_error() {
  echo -e "${RED}✗ $1${NC}"
}

print_warning() {
  echo -e "${YELLOW}⚠ $1${NC}"
}

print_info() {
  echo -e "${BLUE}ℹ $1${NC}"
}

check_dependencies() {
  print_header "Checking Dependencies"

  if ! command -v k6 &> /dev/null; then
    print_error "k6 is not installed"
    echo ""
    echo "Install k6:"
    echo "  macOS:   brew install k6"
    echo "  Linux:   sudo apt-key adv --keyserver hkp://keyserver.ubuntu.com:80 --recv-keys C5AD17C747E3415A3642D57D77C6C491D6AC1D69"
    echo "           echo 'deb https://dl.k6.io/deb stable main' | sudo tee /etc/apt/sources.list.d/k6.list"
    echo "           sudo apt-get update"
    echo "           sudo apt-get install k6"
    echo "  Windows: choco install k6"
    echo ""
    echo "Or download from: https://k6.io/docs/getting-started/installation/"
    exit 1
  fi

  print_success "k6 is installed ($(k6 version))"
}

show_usage() {
  cat << EOF
Usage: $0 [test_type] [environment] [options]

Test Types:
  smoke       Quick validation (5 VUs, 30s)
  auth        Authentication load test (50 VUs, 4m)
  agents      Agents CRUD load test (100 VUs, 16m)
  pipelines   Pipelines CRUD load test (100 VUs, 16m)
  stress      Stress test to find limits (500 VUs, 20m)
  spike       Spike test for bursts (1000 VUs, 7m)
  soak        Endurance test (100 VUs, 40m)
  all         Run all tests sequentially

Environments:
  local       http://localhost:8000
  development https://dev.kaizen-studio.example.com
  staging     https://staging.kaizen-studio.example.com
  production  https://kaizen-studio.example.com

Options:
  --vus NUM         Override virtual users
  --duration TIME   Override duration (e.g., 5m, 30s)
  --base-url URL    Override base URL
  --html            Generate HTML report
  --summary         Generate JSON summary

Examples:
  $0 smoke development
  $0 stress staging --html
  $0 all staging --html --summary
  $0 auth local --vus 20 --duration 2m

EOF
}

get_base_url() {
  local env=$1
  case $env in
    local)
      echo "http://localhost:8000"
      ;;
    development)
      echo "https://dev.kaizen-studio.example.com"
      ;;
    staging)
      echo "https://staging.kaizen-studio.example.com"
      ;;
    production)
      echo "https://kaizen-studio.example.com"
      ;;
    *)
      echo "http://localhost:8000"
      ;;
  esac
}

run_test() {
  local test_type=$1
  local environment=$2
  local base_url=$3
  local extra_args=$4

  local script_path="${SCRIPT_DIR}/scripts/${test_type}.js"
  local timestamp=$(date +%Y%m%d_%H%M%S)
  local report_base="${REPORTS_DIR}/${test_type}_${environment}_${timestamp}"

  if [ ! -f "$script_path" ]; then
    print_error "Test script not found: $script_path"
    return 1
  fi

  print_header "Running ${test_type} test on ${environment}"
  print_info "Base URL: ${base_url}"
  print_info "Script: ${script_path}"
  print_info "Started: $(date)"

  # Build k6 command
  local k6_cmd="k6 run"
  k6_cmd="$k6_cmd --env ENVIRONMENT=${environment}"
  k6_cmd="$k6_cmd --env BASE_URL=${base_url}"

  # Add summary export
  k6_cmd="$k6_cmd --summary-export=${report_base}_summary.json"

  # Add extra arguments
  if [ -n "$extra_args" ]; then
    k6_cmd="$k6_cmd $extra_args"
  fi

  # Add script path
  k6_cmd="$k6_cmd $script_path"

  # Run the test
  echo ""
  print_info "Command: $k6_cmd"
  echo ""

  if eval "$k6_cmd" > "${report_base}_output.txt" 2>&1; then
    print_success "Test completed successfully"
    cat "${report_base}_output.txt"

    # Generate HTML report if jq is available
    if command -v jq &> /dev/null && [ -f "${report_base}_summary.json" ]; then
      generate_html_report "${report_base}_summary.json" "${report_base}.html"
      print_success "HTML report: ${report_base}.html"
    fi

    print_success "Summary JSON: ${report_base}_summary.json"
    print_success "Full output: ${report_base}_output.txt"
  else
    print_error "Test failed"
    cat "${report_base}_output.txt"
    return 1
  fi

  print_info "Completed: $(date)"
  echo ""
}

generate_html_report() {
  local json_file=$1
  local html_file=$2

  cat > "$html_file" << 'EOF'
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>k6 Load Test Report</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
      margin: 0;
      padding: 20px;
      background: #f5f5f5;
    }
    .container {
      max-width: 1200px;
      margin: 0 auto;
      background: white;
      padding: 30px;
      border-radius: 8px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    h1 {
      color: #333;
      border-bottom: 3px solid #7d64ff;
      padding-bottom: 10px;
    }
    h2 {
      color: #555;
      margin-top: 30px;
    }
    .metric-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
      gap: 20px;
      margin: 20px 0;
    }
    .metric-card {
      border: 1px solid #e0e0e0;
      border-radius: 6px;
      padding: 20px;
      background: #fafafa;
    }
    .metric-name {
      font-weight: 600;
      color: #666;
      font-size: 14px;
      margin-bottom: 10px;
    }
    .metric-value {
      font-size: 28px;
      font-weight: 700;
      color: #333;
    }
    .metric-unit {
      font-size: 16px;
      color: #999;
    }
    .status-pass {
      color: #4caf50;
    }
    .status-fail {
      color: #f44336;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin: 20px 0;
    }
    th, td {
      text-align: left;
      padding: 12px;
      border-bottom: 1px solid #e0e0e0;
    }
    th {
      background: #f5f5f5;
      font-weight: 600;
      color: #666;
    }
    .footer {
      margin-top: 40px;
      padding-top: 20px;
      border-top: 1px solid #e0e0e0;
      color: #999;
      font-size: 14px;
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>k6 Load Test Report</h1>
    <div id="content">Loading...</div>
  </div>

  <script>
EOF

  # Inline the JSON data
  echo "    const data = " >> "$html_file"
  cat "$json_file" >> "$html_file"

  cat >> "$html_file" << 'EOF'
;

    // Render the report
    const container = document.getElementById('content');

    let html = `
      <div class="metric-grid">
        <div class="metric-card">
          <div class="metric-name">Virtual Users</div>
          <div class="metric-value">${data.metrics.vus?.max || 'N/A'}</div>
        </div>
        <div class="metric-card">
          <div class="metric-name">Total Requests</div>
          <div class="metric-value">${data.metrics.http_reqs?.count || 'N/A'}</div>
        </div>
        <div class="metric-card">
          <div class="metric-name">Request Rate</div>
          <div class="metric-value">${data.metrics.http_reqs?.rate?.toFixed(2) || 'N/A'} <span class="metric-unit">req/s</span></div>
        </div>
        <div class="metric-card">
          <div class="metric-name">Error Rate</div>
          <div class="metric-value ${(data.metrics.http_req_failed?.rate || 0) > 0.01 ? 'status-fail' : 'status-pass'}">${((data.metrics.http_req_failed?.rate || 0) * 100).toFixed(2)}%</div>
        </div>
      </div>

      <h2>Response Time</h2>
      <table>
        <tr>
          <th>Metric</th>
          <th>Average</th>
          <th>Min</th>
          <th>Max</th>
          <th>p(95)</th>
          <th>p(99)</th>
        </tr>
        <tr>
          <td>HTTP Request Duration</td>
          <td>${data.metrics.http_req_duration?.avg?.toFixed(2) || 'N/A'} ms</td>
          <td>${data.metrics.http_req_duration?.min?.toFixed(2) || 'N/A'} ms</td>
          <td>${data.metrics.http_req_duration?.max?.toFixed(2) || 'N/A'} ms</td>
          <td>${data.metrics.http_req_duration?.['p(95)']?.toFixed(2) || 'N/A'} ms</td>
          <td>${data.metrics.http_req_duration?.['p(99)']?.toFixed(2) || 'N/A'} ms</td>
        </tr>
      </table>

      <h2>All Metrics</h2>
      <table>
        <tr>
          <th>Metric Name</th>
          <th>Count</th>
          <th>Rate</th>
          <th>Average</th>
          <th>p(95)</th>
          <th>p(99)</th>
        </tr>
    `;

    Object.entries(data.metrics).forEach(([name, values]) => {
      html += `
        <tr>
          <td>${name}</td>
          <td>${values.count !== undefined ? values.count : '-'}</td>
          <td>${values.rate !== undefined ? values.rate.toFixed(4) : '-'}</td>
          <td>${values.avg !== undefined ? values.avg.toFixed(2) : '-'}</td>
          <td>${values['p(95)'] !== undefined ? values['p(95)'].toFixed(2) : '-'}</td>
          <td>${values['p(99)'] !== undefined ? values['p(99)'].toFixed(2) : '-'}</td>
        </tr>
      `;
    });

    html += `
      </table>
      <div class="footer">
        Generated on ${new Date().toLocaleString()}
      </div>
    `;

    container.innerHTML = html;
  </script>
</body>
</html>
EOF

  print_success "Generated HTML report: $html_file"
}

################################################################################
# Main Script
################################################################################

main() {
  # Check dependencies
  check_dependencies

  # Parse arguments
  local test_type=${1:-""}
  local environment=${2:-"development"}
  local base_url=""
  local extra_args=""

  shift 2 2>/dev/null || true

  # Parse optional arguments
  while [[ $# -gt 0 ]]; do
    case $1 in
      --vus)
        extra_args="$extra_args --vus $2"
        shift 2
        ;;
      --duration)
        extra_args="$extra_args --duration $2"
        shift 2
        ;;
      --base-url)
        base_url="$2"
        shift 2
        ;;
      --html)
        # HTML report is generated by default if jq is available
        shift
        ;;
      --summary)
        # Summary is always generated
        shift
        ;;
      *)
        print_error "Unknown option: $1"
        show_usage
        exit 1
        ;;
    esac
  done

  # Show usage if no test type provided
  if [ -z "$test_type" ]; then
    show_usage
    exit 0
  fi

  # Get base URL if not overridden
  if [ -z "$base_url" ]; then
    base_url=$(get_base_url "$environment")
  fi

  # Run tests
  case $test_type in
    smoke|auth|agents|pipelines|stress|spike|soak)
      run_test "$test_type" "$environment" "$base_url" "$extra_args"
      ;;
    all)
      print_header "Running All Tests"
      local tests=("smoke" "auth" "agents" "pipelines" "stress" "spike" "soak")
      local failed_tests=()

      for test in "${tests[@]}"; do
        if ! run_test "$test" "$environment" "$base_url" "$extra_args"; then
          failed_tests+=("$test")
        fi
        sleep 5
      done

      echo ""
      print_header "Test Suite Summary"
      if [ ${#failed_tests[@]} -eq 0 ]; then
        print_success "All tests passed!"
      else
        print_error "Failed tests: ${failed_tests[*]}"
        exit 1
      fi
      ;;
    *)
      print_error "Unknown test type: $test_type"
      show_usage
      exit 1
      ;;
  esac
}

# Run main function
main "$@"
