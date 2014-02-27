<?php

// Paramter check

if ($argc != 2)
{
	echo "Usage: store.php json_file";
	return 1;
}

$fileName = $argv[1];
echo "fileName = $fileName\n";

// Open a file and reads the content of the spider
if(file_exists($fileName))
{
	$content = file_get_contents($fileName);

	$topic_list = json_decode($content);

/**
	var_dump($topic_list[0]);
	var_dump($topic_list[1]);
	var_dump($topic_list[2]);
	echo $topic_list[0]->{"title"};
	echo $topic_list[1]->{"title"};
*/
	
}
else
{
	echo "Open file failed: $fileName";
}

// Store the content in database


return 0;

?>