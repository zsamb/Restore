$(document).ready(function() {
  $("#sidebar-account-edit-link, #edit-account-popup-container .popup-window-close, .popup-cancel-button").click(function() {
    $("#popup-overlay").toggleClass("visible-popup-overlay")
    $("#edit-account-popup-container").toggleClass("visible-popup-window")
  })
  $("#popup-overlay").click(function() {
    if (document.getElementById("edit-account-popup-container").classList.contains("visible-popup-window")) {
      $("#popup-overlay").toggleClass("visible-popup-overlay")
      $("#edit-account-popup-container").toggleClass("visible-popup-window")
    }
  })
  $(".popup-save-button").click(function() {
    $("#edit-account-popup-container").toggleClass("visible-popup-window")
    $("#popup-overlay").toggleClass("visible-popup-overlay")
    showLoadingOverlay()
  })
})
