var boardGame;                          //Game board of number of cells
var PresentPlayTag = $("#PresentTurn"); // Display the current player's name
var MultiPlayer = false;   
var player = "X";                       //Minimizing Player (human player)
var player_2 = "O";                     //Maximizing Player (AI agent)
var PresentTurn = player;
var EndOfGame = 1;
var maxDepth = 6;
var truedepth = maxDepth;              //Stores the actual maxdepth according to level and comes handy at the time of suggestions 
var depth;
var chance;
var x = document.getElementById("grid").rows.length;
const WinningCombs = [                 //Stores the winning combinations for everyplayer
  [0, 1, 2],
  [3, 4, 5],
  [6, 7, 8],

  [0, 3, 6],
  [1, 4, 7],
  [2, 5, 8],

  [0, 4, 8],
  [2, 4, 6],
];

const WinningCombs2 = [                 //Stores the winning combinations for everyplayer
  [0, 1, 2, 3],
  [4, 5, 6, 7],
  [8, 9, 10, 11],
  [12, 13, 14, 15],

  [0, 4, 8, 12],
  [1, 5, 9, 13],
  [2, 6, 10, 14],
  [3, 7, 11, 15],

  [0, 5, 10, 15],
  [3, 6, 9, 12],
];


const cells = $(".cell");          //Selects each cell class on HTML 

function SetLevelOne() {           //Sets the depth with which the AI plays according to the level selected
  maxDepth = 1;                    //Sets maxdepth in recursion tree as 1
  truedepth = maxDepth;
}

function SetLevelTwo() {            //Sets maxdepth in recursion tree as 2
  maxDepth = 2;
  truedepth = maxDepth;
}

function SetLevelThree() {          //Sets maxdepth in recursion tree as 3
  maxDepth = 3;
  truedepth = maxDepth;
}

function SetLevelInf() {            //Sets maxdepth in recursion tree as 6. Earlier we had kept it till length of board but that is not required
  maxDepth = 6;                     //Since the utility based agent will anyway not choose longer moves to win
  truedepth = maxDepth;
}
$(".button").on("click", function () {   //Adds the desired effect to the level buttons
  $(".btn-group").addClass("noHover");   // btn-group class is there is Levels on HTML
  $(this).css("color", "#723267");
});

function startGame() {
  cells.removeClass("disabled");
  maxDepth = 6;
  truedepth = 6;
  $(".button").css("color", "white");      
  $(".sug").css("color", "#723267");      //Increases the opacity of table(boardgame) and suggestion button as the game starts
  $("table").animate({
    opacity: "1",
  });
  if (MultiPlayer == true) {              // When two human players are playing only the suggestions button is enabled
    $(".sug").removeClass("disabled");
    $(".sug").removeClass("noHover");
  }
  if (MultiPlayer == false) {            //When playing with AI in single mode, the levels btn-group and the suggestions button are enabled
    $(".btn-group").removeClass("disabled");
    $(".btn-group").removeClass("noHover");
    $(".sug").removeClass("disabled");
    $(".sug").removeClass("noHover");
  }
  PresentTurn = player;                          //Stores the turn of the current player
  PresentPlayTag = $("#PresentTurn");
  $("#f1").text(PresentTurn);
  $("#f2").text(PresentTurn == "X" ? "O" : "X"); //These tags display the turn alternatively

  cells.on("click", PresentTurnClick);           //Enables the player to play the turn by clicking the cell
  EndOfGame = 0;
  $(".end-game").value = "none";
  if(x==3){
  boardGame = Array.from(Array(9).keys());       //Generates key for each cell with cell id
  }
  else if(x==4){
  boardGame = Array.from(Array(16).keys()); 
  }
  ClearTicTacToe();                     
}

function endGame() {                             //disables the boardgame on endgame
  $("table").animate({
    opacity: "0.4",
  });
  EndOfGame = 1;
  ClearTicTacToe();
  PresentPlayTag.text("- - - - - - - -");
  cells.off("click");

  $(".btn-group").addClass("disabled");          //disables the suggestion and level buttons on endgame
  $(".sug").addClass("disabled");
  maxDepth = 6;
  $(".button").css("color", "white");
}

function PresentTurnClick(square) {
  if (typeof boardGame[square.target.id] == "number") {   //Allows the player to play the turn only if the cell is empty
    turn(square.target.id, PresentTurn);                  //Plays the turn on the selected cell using PresentTurn
    if (!CheckForWin(boardGame, player) && !CheckForTie()) {  //If the terminal i.e. Win or Tie state has not been reached
      if (MultiPlayer === false) {
        cells.off("click");                                //Disables the cells to ensure only one click per user
        setTimeout(function () {
          turn(bestChoice(false), player_2);               //Chooses the best possible move for the AI agent according to the Level
          cells.on("click", PresentTurnClick);
          $(".sug").on("click", function () {
            suggestions(bestChoice(true), player);         //Suggests the best possible move for the player irresepective of the Level
          });
        }, 700);
      } else if (MultiPlayer === true) {
        $(".sug").on("click", function () {
          suggestions(bestChoice(true), player);           //Suggests the best possible move for the player in Two Player Mode
        });
      }
    }
  }
}

function turn(boxId, player) {                //Takes the boxid and player and fills the html cell with boxid with player id
  currentPlayer = player == "X" ? "O" : "X";  //Gives the chance to next player
  if (MultiPlayer == false) {
    if (currentPlayer != player_2)            //player_2 is the AI player
      PresentPlayTag.text("You Play Next: " + currentPlayer);
    else PresentPlayTag.text("AI's turn " + currentPlayer);
  } else PresentPlayTag.text("You Play Next: " + currentPlayer);
  boardGame[boxId] = player;                  //Changes the boxid to the player's id
  $("#" + boxId).text(player);                //Displays the boxid as the player's id
  let gameFinished = CheckForWin(boardGame, player);  //Passes the boardgame with the currentplayer and checks for win
  CheckForTie();
  if (gameFinished) {
    gameOver(gameFinished);
  }

  PresentTurn = PresentTurn == "X" ? "O" : "X";
}

function MinMax(PresentGameBoard, currentPlayer, depth, flag, alpha, beta) { //Optimised using alpha beta, flag for suggestions
  
  if (flag == true) maxDepth = 6;            //For suggestions
  if (flag == false) maxDepth = truedepth;    //For AI agent
  var availableMoves = AvailableMoves();      //Get an array of empty cells from the present board state

  if (CheckForWin(PresentGameBoard, player)) {//If terminal state is reached
    return -100+depth;                        //Adds the depth to the score of the Minimizing player to ensure that AI agent selects Shortest path to Win
                                          
  } else if (CheckForWin(PresentGameBoard, player_2)) {
    return 100-depth;                                 //Hence our agent proves to be UTILITY BASED 
  } else if (availableMoves.length === 0 || depth == maxDepth) {
    return 0;
  }

 depth=depth+1;

var newscore, move;                                       //newscore stores result of minmax
if(currentPlayer==player_2){                              //if currentPlayer is player_2
  
  for(var i = 0; i<availableMoves.length;i++){             //Loop till available moves in present board
      move = PresentGameBoard[availableMoves[i]];          //Store the current index in move
      PresentGameBoard[availableMoves[i]] = currentPlayer; //Store playerid in cell id to anticipate next moves
      newscore=MinMax(PresentGameBoard,player,depth,flag, alpha,beta); //call minmax for new state
      PresentGameBoard[availableMoves[i]] = move;          //remove the player id and store original id
      if(newscore>alpha){                                  //if alpha is less than new score, update the value of alpha to new score
      alpha=newscore;
      if(depth===1){                                       //store the value at depth one because that is the ultimate result of that branch
      chance=move;
  }
} 
else if(alpha >=beta){                                    //if alpha is more than beta, return alpha from there
  return alpha;
}

}return alpha;                             
}
else{
  for(var i = 0; i<availableMoves.length;i++){           //Loop till available moves in present board
      move = PresentGameBoard[availableMoves[i]];        //Store the current index in move
      PresentGameBoard[availableMoves[i]] = currentPlayer;    //Store playerid in cell id to anticipate next moves
      newscore=MinMax(PresentGameBoard,player_2,depth,flag, alpha,beta); //call minmax for new state
      PresentGameBoard[availableMoves[i]] = move;         //remove the player id and store original id
      
      if(newscore<beta){                                  //if beta is more than new score, update the value of alpha to new score
          beta=newscore;
          if(depth===1){                                 //store the value at depth one because that is the ultimate result of that branch
              chance = move;
          }
      }
      else if (beta <= alpha)                            //if alpha is more than beta, return beta from there
              return beta;           
  }
}
return beta; 
}


function CheckForWin(board, player) {                                        
  let plays = board.reduce(
    (acc, elem, index) => (elem === player ? acc.concat(index) : acc),      //Used the arrow function from jQuery to reduce the board storing the plays of the current player only
    []
  );
  let gameFinished = null;
  var WinningC;
  if(x==3){                                                          //for 3x3 grid
    WinningC= WinningCombs;
  }else if(x==4){                                                    //for 4x4 grid
    WinningC= WinningCombs2;
  }
  for (let [index, win] of WinningC.entries()) {                        //For every index of winning combos(row of 3), check if every element of that index is there in the plays of the player
    if (win.every((elem) => plays.indexOf(elem) > -1)) {                //When every element of that index is found, store the playerid and that index of winning combos
      gameFinished = {                                                   //Store id of player in case of win and the corresponding index of winning combos
        index: index,
        player: player,
      };
      break;
    }
  }
  return gameFinished;
}

function gameOver(gameFinished) {
  cells.addClass("disabled");
  EndOfGame = 1;
  maxDepth = 6;
  cells.off("click");                                                 //Disable the cells of boardgame
  cells.animate({
    opacity: "0.4",
  });
  var WinningC;
  if(x==3){
    WinningC= WinningCombs;
  }else if(x==4){
    WinningC= WinningCombs2;
  }
  for (let index of WinningC[gameFinished.index]) {                   //Animate the cells of the index of Winning combo
    setTimeout(function () {
      $("#" + index).css("background-color", "green");
      $("#" + index).animate({
        opacity: "1",
      });
      $("#PresentTurn").text(gameFinished.player + " WINS");            //Displaying the winner
    }, 500);
  }
}

function AvailableMoves() {
  return boardGame.filter((s) => typeof s == "number");                 //Returns the array of empty cells from present state
}

function CheckForTie() {
  if (AvailableMoves().length === 0) {           //If board game is filled and no Winning combo is found
    EndOfGame = 1;
    cells.addClass("disabled");
    cells.off("click");
    cells.animate({
      opacity: "0.4",
    });
    PresentPlayTag.text("TIE GAME!");                                   //Displays tie

    return true;
  }
  return false;
}

function bestChoice(flag) {                                            //Flag parameter to differentiate between AI and human player
   MinMax(boardGame, player_2, 0, flag, -Infinity, +Infinity);                   //Returns index of best move
   var index = chance;
   return index;
}

function ClearTicTacToe() {
  for (var i = 0; i < cells.length; i++) {
    $("#" + i).text("");
  }

  for (var i = 0; i < cells.length; i++) {
    cells[i].value = "";
    cells[i].style.removeProperty("background-color");
    cells[i].style.removeProperty("opacity");
    cells.on("click", PresentTurnClick);
  }
  PresentPlayTag.text("You Play Next: " + player);
}

function ReverseIt() {                                           //Reverses X and O in two player mode, enabled by glyphicon
  if (EndOfGame === 1 && MultiPlayer == true) {
    PresentTurn = PresentTurn == player ? player_2 : player;     
    player = player == "X" ? "O" : "X";
    player_2 = player_2 == "X" ? "O" : "X";
    PresentFigureCh = $("#f1").text();
    $("#f1").animate({
      opacity: "0",
    });
    $("#f2").animate({
      opacity: "0",
    });
    setTimeout(function () {
      $("#f1").text((PresentFigureCh = PresentFigureCh == "X" ? "O" : "X"));
      $("#f2").text((PresentFigureCh = PresentFigureCh == "X" ? "O" : "X"));
    }, 500);
    $("#f1").animate({
      opacity: "1",
    });
    $("#f2").animate({
      opacity: "1",
    });
  }
}

function activeMultiPlayer() {         //Differentiates between two player mode and one player mode
  if (EndOfGame === 1) {
    if (MultiPlayer) {
      $("#p2").animate({
        opacity: "0.3",
      });
    } else {
      $("#p2").animate({
        opacity: "1",
      });
    }
    MultiPlayer = MultiPlayer == true ? false : true;
  }
}

function suggestions(boxId, player) {        //Takes bestchoice of the currentplayer and creates a blinking effect
  if (AvailableMoves.length != 9||AvailableMoves.length != 16) {
    setTimeout(function () {
      $("#" + boxId).animate({
        opacity: "0.6",
      });
    }, 3);
    setTimeout(function () {
      $("#" + boxId).animate({
        opacity: "1",
      });
    }, 7);

    $(".sug").removeClass("disabled");
    $(".sug").removeClass("noHover");
  }
}



  $(".feature").hover(function(){          //Navbar animation on dropdowns
    $(".feat").fadeToggle("slow");
  });
  $(".howtoplay").hover(function(){
    $(".htplay").fadeToggle("slow");
  });
  $(".contactus").hover(function(){
    $(".contactuss").fadeToggle("slow");
  });
