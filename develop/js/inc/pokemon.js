var pokemon = (function($, window) {

	this.pokelist = [];

	this.grid = [];

	// Game rules
	this.clicksAllowed = 9;
	this.clicksUsed = 0;
	this.pokemonClicks = []; // Number of clicks per pokemon
	this.tilesCount = 16;
	this.gameState = 'gameOn';
	this.pokeCount = 4; // Number of different pokemon to load
	


	function init() {
		var self = this;

		// Create a click counter for every pokemon and set it to 0 
		self.pokemonClicks.length = pokeCount;
		for (var i = 0; i < pokemonClicks.length; i++) {
			pokemonClicks[i] = 0;
		}

		initiateGrid();

		//$("#generate").on("click", generateGrid);
		generateGrid();


		return {
			pokelist: pokelist
		};
	}



	//////////////////////////////////////////
	//////		Random PokéGeneration	//////
	//////////////////////////////////////////

	// There are 778 pokemon on the database
	// This function allows us to generate a random number between two limits
	function randomIntFromInterval(min,max){
	    return Math.floor( Math.random() * (max - min + 1) + min);
	};

	// A more specific number between 0 and the number of poke on database
	function randPokemon() {
	    return randomIntFromInterval(0, 718).toString();
	}

	// Fetch a random pokemon image
	function generateSprite(urlinput) {
		var self = this;
		var pokeId = randPokemon();

		pullDataById(urlinput, pokeId, function(data) {
			var href = "http://pokeapi.co" + data.image;
            self.pokelist.push({
            	imageUrl: href,
            	pokemonName: data.name
            });
            spriteLoaded();
		})
	}

	function pullDataById(urlinput, pokeId, callback) {
		// Check local storage for the ID
		localforage.getItem(pokeId).then( function(localData) {
			// If no local data, fetch from server
			if (!localData) {
				// not stored locally, proceed to API
				var generateurl = "http://pokeapi.co/api/v1/" + urlinput + pokeId;

			    $.ajax({
			        type: "GET",
			        url: generateurl,
			        dataType: "jsonp",
			        async: true,
			        success: function(data){
			        	// once new data is pulled from server, cache it locally and then run callback
			        	var d = data;
			        	localforage.setItem(pokeId, d).then( function(data) {
			        		console.log("Saved data for "+d.name+" locally!");
			        	})

			            if (callback) { callback(d) };
			        },
			        error: function (error){
			        	console.log("ajax fucked up", error);
			        }
			    });

			} else {
				// If local data is found, pass it back to the callback
				console.log("Found data locally for "+pokeId);
				if (callback) { callback(localData) };
			}
		})

	}

	function generateGrid() {
		var self = this;

		// Fetch 9 random pokemon images
		pokelist = [];
		for (var i = 0; i < self.pokeCount; i++) {
			generateSprite("sprite/")
		}
		


	}

	function spriteLoaded() {
		var self = this;
		if (self.pokelist.length >= self.pokeCount) {
			// Pokelist fully populated
			console.log('All pokemon loaded');
			// Create an array filled with equal amounts of all pokemon

			var pokemonToAdd = [];
			for (var i = 0; i < self.pokeCount; i++) {
				for (var j = 0; j < (self.tilesCount / self.pokeCount); j++) {

					pokemonToAdd.push(self.pokelist[i]);
					pokemonToAdd[pokemonToAdd.length - 1].pokemonCount = i;

				}
			}



			var $pokeTiles = $('#pokegrid .tile .hidden');

			for (var i = 0; i < $pokeTiles.length; i++) {

				var b = randomIntFromInterval(0,(pokemonToAdd.length - 1));
				var $tile = $($pokeTiles[i]);

				var name = pokemonToAdd[b].pokemonName;
				var nameFormatted = name.substring(0, (name.length - 5));

				$($tile).css('background-image', 'url('+pokemonToAdd[b].imageUrl+')');
				$($tile).parent().attr('data-pokemon-name', nameFormatted);
				$($tile).parent().attr('data-pokemon-count', pokemonToAdd[b].pokemonCount);

				pokemonToAdd.splice(b, 1);

			}
		} else {
			return;
		}
	}

	//////////////////////// End PokéGeneration //////////////////////////////




	//////////////////////////////////////////
	//////		Grid Functionality		//////
	//////////////////////////////////////////


	function initiateGrid() {
		var self = this;

		$('#click-counter').text(self.clicksAllowed);
		var rows = $('#pokegrid .row');

		for ( var i = 0; i < rows.length; i++) {
			var tilePokemon = [];
			var tiles = $(rows[i]).find('.tile');

			// iterate over every tile in the row, adding data about the pokemon to the tiles array for the row
			for ( var j = 0; j < tiles.length; j++) {
				var pokeName = $(tiles[j]).attr('data-pokemon-name');
				tilePokemon.push({
					pokeName: pokeName
				})
			}

			// Add this row array to the main grid array
			this.grid.push(tilePokemon);
		}


		$('#pokegrid .cover').on('click', function(e) {
			coverClicked(e.target);
		})

		$('#warning').on('click', function(e) {
			warningClicked(e);
		})
	}


	function coverClicked(target) {
		var self = this;

		$(target).hide();
		self.clicksUsed++;
		$('#click-counter').text(self.clicksAllowed - self.clicksUsed);

		$(target).closest('.tile').addClass('clicked');

		

		var countClicked = $(target).parent().attr('data-pokemon-count');
		self.pokemonClicks[countClicked]++;
		console.log('Count clicked and total clicks', countClicked,self.pokemonClicks[countClicked]);
		if (self.pokemonClicks[countClicked] >= (self.tilesCount / self.pokeCount)) {
			// All pokemon found

			gameWon(target);
			return;
		}

		if (self.clicksUsed >= self.clicksAllowed) {
			console.log('Game over!');
			gameOver();
		}


	}

	function warningClicked(e) {
		var self = this;

		switch(self.gameState) {
			case'gameOver':
				self.gameState = 'gameOn';
				refreshGrid();
				$('#warning').hide();
				break;

			case 'gameWon':
				self.gameState = 'gameOn';
				refreshGrid();
				$('#warning').hide();
				break;
		}

		$('#pokegrid .grid').removeClass('warning');
	}

	function gameOver() {
		var self = this;
		self.pokemonClicks = [];
		self.pokemonClicks.length = pokeCount;
		for (var i = 0; i < pokemonClicks.length; i++) {
			pokemonClicks[i] = 0;
		}

		$('#warning').text('Game Over!');
		$('#warning').show();
		$('#pokegrid .grid').addClass('warning');
		self.gameState = 'gameOver';
	}

	function gameWon(lastClicked) {
		var self = this;

		var winningPokemon = $(lastClicked).parent().attr('data-pokemon-name');
		self.pokemonClicks = [];
		self.pokemonClicks.length = pokeCount;
		for (var i = 0; i < pokemonClicks.length; i++) {
			pokemonClicks[i] = 0;
		}

		$('#warning').html('You Caught <span class="winning-pokemon">'+winningPokemon+'</span>!');
		$('#warning').show();
		$('#pokegrid .grid').addClass('warning');
		self.gameState = 'gameWon';
	}

	function refreshGrid() {
		var self = this;
		generateGrid()
		$('.clicked').removeClass('clicked');
		$('#pokegrid .cover').show(); 
		$('#click-counter').text(self.clicksAllowed);
		self.clicksUsed = 0;
	}









	//////////////////		End Grid 		////////////////////////










	var instance;


	return {
		getInstance: function() {
			if (!instance) {
				instance = init();
			}

			return instance;
		}
	}

}(jQuery,window));