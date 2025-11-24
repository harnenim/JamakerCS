var VERSION = "20240312v01";

var TABLE_MOVIE = new Table("movie", [
		new Column("movieCd"    , "TEXT", true, true)
	,	new Column("movieNm"    , "TEXT", true, true)
	,	new Column("movieNmEn"  , "TEXT", true)
	,	new Column("prdtYear"   , "TEXT", true)
	,	new Column("openDt"     , "TEXT", true)
	,	new Column("typeNm"     , "TEXT", true)
	,	new Column("prdtStatNm" , "TEXT")
	,	new Column("nationAlt"  , "TEXT")
	,	new Column("genreAlt"   , "TEXT")
	,	new Column("repNationnm", "TEXT")
	,	new Column("repGenreNm" , "TEXT")
	,	new Column("directors"  , "TEXT")
	,	new Column("peopleNm"   , "TEXT")
	,	new Column("companys"   , "TEXT")
	,	new Column("companyCd"  , "TEXT")
	,	new Column("companyNm"  , "TEXT")
	,	new Column("count"      , "INTEGER")
], "movieCd");

var TABLE_WATCH = new Table("watch", [
		new Column("date"   , "INTEGER", true, true)
	,	new Column("time"   , "INTEGER", false, true)
	,	new Column("group"  , "TEXT", true)
	,	new Column("place"  , "TEXT")
	,	new Column("screen" , "TEXT")
	,	new Column("movie"  , "TEXT", true, true)
	,	new Column("movieCd", "TEXT", true)
]);

var GROUPS = ["CGV", "메가박스", "롯데시네마"];

var COLORS =
{ level0: "#fff"
, level1: "#f0f0f0"
, level2: "#eee"
, level3: "#e8e8e8"
, level4: "#ddd"
, level5: "#ccc"
, level6: "#aaa"
, level7: "#888"
, level_: "#000"
, hover : "#eff"
, alert : "#fcc"
, focus : "#06a"
};