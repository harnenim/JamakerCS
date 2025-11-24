const VERSION = "20240312v01";

const TABLE_ANIME = new Table("anime", [
		new Column("_"       , "INTEGER", true)
	,	new Column("origin"  , "TEXT"   , true)
	,	new Column("title"   , "TEXT"   , true)
	,	new Column("path"    , "TEXT"   , true, true)
	,	new Column("status"  , "TEXT"   , true)
	,	new Column("subtitle", "TEXT"   , true)
	,	new Column("check"   , "INTEGER", true)
	,	new Column("tag"     , "TEXT"   )
	,	new Column("begin"   , "TEXT"   , true)
	,	new Column("end"     , "TEXT"   , true)
], "_");

const TABLE_SUBTITLE = new Table("subtitle", [
		new Column("_"       , "INTEGER", true)
	,	new Column("anime"   , "INTEGER")
	,	new Column("title"   , "TEXT"   , true, true)
	,	new Column("url"     , "TEXT"   , true)
	,	new Column("begin"   , "TEXT"   , true)
	,	new Column("end"     , "TEXT"   , true)
	,	new Column("complete", "TEXT"   , true)
	,	new Column("updated" , "TEXT"   , true)
	,	new Column("len"     , "INTEGER")
	,	new Column("ep"      , "INTEGER", true)
	,	new Column("etc1"    , "INTEGER")
	,	new Column("etc2"    , "INTEGER")
	,	new Column("etc3"    , "INTEGER")
	,	new Column("etc4"    , "INTEGER")
	,	new Column("etc5"    , "INTEGER")
	,	new Column("etc6"    , "INTEGER")
	,	new Column("etc7"    , "INTEGER")
	,	new Column("etc8"    , "INTEGER")
	,	new Column("etc9"    , "INTEGER")
], "_");
