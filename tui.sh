#!/usr/bin/env bash
#================================================================
# tty‑based UI (TUI) for managing the OTP‑2FA repository
# - Installs dependencies (dialog, git, node, npm)
# - Clones the repo (or pulls updates)
# - Runs existing ./setup.sh with full error handling
# - Shows Git version history (last 10 commits)
# - Allows pulling latest changes from GitHub reliably
# - Logs everything to tui.log for troubleshooting
#================================================================

# -------------------- Configuration --------------------
# Change REPO_URL to point to your actual GitHub repository
REPO_URL="https://github.com/your-org/your-repo.git"   # <-- edit this line
REPO_DIR="${HOME}/otp-2fa-repo"
SETUP_SCRIPT="setup.sh"
LOG_FILE="${REPO_DIR}/tui.log"
# -------------------------------------------------------

# Ensure script runs from its own directory
cd "$(dirname "$0")" || exit 1

# -------------------- Helper functions --------------------
log() {
  echo "$(date '+%Y-%m-%d %H:%M:%S') | $*" | tee -a "$LOG_FILE"
}

error_exit() {
  dialog --title "Error" --msgbox "$1" 10 60
  log "ERROR: $1"
  exit 1
}

install_deps() {
  dialog --title "Installing dependencies" --infobox "Installing required packages…" 5 50
  sudo apt-get update -y >>"$LOG_FILE" 2>&1 || error_exit "apt update failed."
  sudo apt-get install -y dialog git curl gnupg2 >>"$LOG_FILE" 2>&1 || error_exit "apt install (dialog, git, curl) failed."
  # Node.js 20.x (LTS)
  curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash - >>"$LOG_FILE" 2>&1 || error_exit "NodeSource script failed."
  sudo apt-get install -y nodejs >>"$LOG_FILE" 2>&1 || error_exit "Installing nodejs failed."
  sudo npm install -g pm2 >>"$LOG_FILE" 2>&1 || error_exit "Installing pm2 failed."
}

clone_or_pull_repo() {
  if [[ -d "$REPO_DIR/.git" ]]; then
    dialog --title "Repository exists" --yesno "The repository already exists. Pull latest changes?" 8 60
    if [[ $? -eq 0 ]]; then
      (
        cd "$REPO_DIR" && \
        git fetch --all >>"$LOG_FILE" 2>&1 && \
        git reset --hard origin/main >>"$LOG_FILE" 2>&1
      ) || error_exit "Git pull failed."
      dialog --msgbox "Repository updated successfully." 6 40
    else
      dialog --msgbox "Skipping pull." 5 30
    fi
  else
    dialog --title "Cloning repository" --infobox "Cloning $REPO_URL…" 5 50
    git clone "$REPO_URL" "$REPO_DIR" >>"$LOG_FILE" 2>&1 || error_exit "Git clone failed."
    dialog --msgbox "Repository cloned successfully." 6 40
  fi
}

run_setup() {
  if [[ ! -x "${REPO_DIR}/${SETUP_SCRIPT}" ]]; then
    chmod +x "${REPO_DIR}/${SETUP_SCRIPT}" || error_exit "Failed to make setup.sh executable."
  fi
  dialog --title "Running setup" --infobox "Executing ${SETUP_SCRIPT}…" 5 60
  pushd "$REPO_DIR" > /dev/null
  bash "./${SETUP_SCRIPT}" >>"$LOG_FILE" 2>&1
  RESULT=$?
  popd > /dev/null
  if [[ $RESULT -ne 0 ]]; then
    error_exit "setup.sh exited with code $RESULT. Check $LOG_FILE for details."
  else
    dialog --msgbox "Setup completed successfully!" 6 40
  fi
}

show_git_history() {
  if [[ -d "$REPO_DIR/.git" ]]; then
    HIST=$(git -C "$REPO_DIR" log -n 10 --pretty=format:"%h %ad %s" --date=short)
    dialog --title "Last 10 commits" --msgbox "$HIST" 20 80
  else
    dialog --msgbox "Git history not available – repository not cloned yet." 6 60
  fi
}

main_menu() {
  while true; do
    CHOICE=$(dialog --clear --title "OTP 2FA Management TUI" \
      --menu "Select an action:" 15 60 6 \
      1 "Install required dependencies" \
      2 "Clone / Pull repository" \
      3 "Run setup.sh (install backend/frontend)" \
      4 "Show last 10 git commits (version history)" \
      5 "Pull latest changes from GitHub" \
      6 "Exit" \
      2>tmp_choice)
    RET=$?
    rm -f tmp_choice
    [[ $RET -ne 0 ]] && break
    case $CHOICE in
      1) install_deps ;;
      2) clone_or_pull_repo ;;
      3) run_setup ;;
      4) show_git_history ;;
      5) clone_or_pull_repo ;;
      6) break ;;
    esac
  done
}

# -------------------- Execution --------------------
log "===== TUI started ====="
install_deps
main_menu
log "===== TUI exited ====="
clear
