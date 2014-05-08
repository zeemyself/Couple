var Maze = cc.Node.extend({
	ctor: function(stage) {
		this.stage = stage;
		this.arrMAP = [
			'####################',
            '#.###............#.#',
            '#.###.###..###.###.#',
            '#.#...#......#...#.#',
            '#.#.###.####.###.#.#',
            '#.#.#..........#.#.#',
            '#.....###. ###.#.#.#',
            '#.#.#..........#...#',
            '#.#.###O####.###.#.#',
            '#.#...#......#...#.#',
            '#.#######..###.###.#',
            '#.#..............#.#',
            '####################'
		]
		this._super();
		this.WIDTH = 20;
		this.HEIGHT = 13;
		this.MAP = [
			['####################',
            '#..................#',
            '#.###.###..###.###.#',
            '#.#...#.O....#...#.#',
            '#.#.###.####.###.#.#',
            '#.#.#..........#.#.#',
            '#.....###..###.....#',
            '#.#.#..........#.#.#',
            '#.#.###O####.###.#.#',
            '#.#...#......#...#.#',
            '#.###.###..###.###O#',
            '#..................#',
            '####################'],

            ['####################',
            '#.###............#.#',
            '#.###.###..###.###.#',
            '#.#...#......#...#.#',
            '#.#.###.####.###.#.#',
            '#.#.#..........#.#.#',
            '#.....###..###.#.#.#',
            '#.#.#..........#...#',
            '#.#.###O####.###.#.#',
            '#.#...#......#...#.#',
            '#.#######..###.###.#',
            '#.#..............#.#',
            '####################'],      

           

             ['####################', 
              '#.##.#.OOO..##.#.#.#',       
              '#.##.#.OOO..##...#.#',
              '#.##...OOO.#.#.#.#.#',
              '#.##.#.OOO##.#.#.#.#',
              '#.#..#...#.#.#.#.#.#',
              '#..#.#.......#.#.#.#',
              '#.#..####.##...#.#.#',
              '#.##..OOO##.##.#.#.#',
              '#.##O........#.#.#.#',
              '#..#OOO####.##.#...#',
              '#............O.#.#.#',
              '####################'],

              ['####################',
               '#..................#',
               '#.############.#####',
               '#.#.#...#O...#.....#',
               '#...###.#..#.#####.#',
               '#.#.#......#.#.....#',
               '#...#.###..#.O..####',
               '#.#.#.#....#.#.....#',
               '#.#.#.#.#..#.#####.#',
               '#.#...#.##.#.......#',
               '#.#.#...#..#######.#',
               '#.#.########.......#',
               '####################']




             


            ];

		for ( var r = 0; r < this.HEIGHT; r++ ) {
	   		 for ( var c = 0; c < this.WIDTH; c++ ) {
				if ( this.MAP[this.stage-1][ r ][ c ] == '#' ) {
		    var s = cc.Sprite.create( 'images/wall2.png' );
		    s.setAnchorPoint( cc.p( 0, 0 ) );
		    s.setPosition( cc.p( c * 40, (this.HEIGHT - r - 1) * 40 ) );
		    this.addChild( s );
		} else if ( this.MAP[this.stage-1][r][c] == 'O'){
			var s = cc.Sprite.create( 'images/water.png' );
		    s.setAnchorPoint( cc.p( 0, 0 ) );
		    s.setPosition( cc.p( c * 40, (this.HEIGHT - r - 1) * 40 ) );
		    this.addChild( s );
		}
	    }
	}
	},
	isWall : function( blockX, blockY){
		var r = this.HEIGHT - blockY - 1;
		var c = blockX;
        // console.log("Wall : " +r + " / "+ c);
		return (this.MAP[(this.stage)-1] [ r ][ c ] == '#' );
	},
    isMario : function(blockX,blockY){
        var r = this.HEIGHT - blockY - 1;
        var c = blockX;
        // var x = this.keep;
        // return x == 'O';
        // return this.MAP[(this.stage)-1] [r][c] == 'O';
        // console.log("Mario : "+r + " / "+ c);
        return (this.MAP[(this.stage)-1] [ r ][ c ]) == 'O' ;
        // return true;
    }
});