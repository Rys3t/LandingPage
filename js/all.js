$(document).ready(function () {
  $(".images img").click(function(){
    $("#full-image").attr("src", $(this).attr("src"));
    $('#image-viewer').show();
    $("h2").hide();
    $('#footer').hide();
    
  });
  
  $("#image-viewer .close").click(function(){
    $('#image-viewer').hide();
    $("h2").show();
    $('#footer').show();
  });
  $("#debug").click(function(){
    $("*").css("outline","1px solid black");
  })
});



