var Maze = cc.Node.extend({
	ctor: function() {
		this._super();
		this.WIDTH = 20;
		this.HEIGHT = 13;
		this.MAP = [
			'####################',
            '#..................#',
            '#.###.###..###.###.#',
            '#.#...#......#...#.#',
            '#.#.###.####.###.#.#',
            '#.#.#..........#.#.#',
            '#.....###. ###.....#',
            '#.#.#..........#.#.#',
            '#.#.###O####.###.#.#',
            '#.#...#......#...#.#',
            '#.###.###..###.###.#',
            '#..................#',
            '####################'
		];
		for ( var r = 0; r < this.HEIGHT; r++ ) {
	    for ( var c = 0; c < this.WIDTH; c++ ) {
		if ( this.MAP[ r ][ c ] == '#' ) {
		    var s = cc.Sprite.create( 'images/wall.png' );
		    s.setAnchorPoint( cc.p( 0, 0 ) );
		    s.setPosition( cc.p( c * 40, (this.HEIGHT - r - 1) * 40 ) );
		    this.addChild( s );
		}
		else if ( this.MAP[r][c] == 'O'){
			var s = cc.Sprite.create( 'images/tree.jpg' );
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
		return (this.MAP [ r ][ c ] == '#');
	}
});