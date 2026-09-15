<?php
$sqlitePath = __DIR__ . '/../backend/database.sqlite';
$seedFile = __DIR__ . '/../backend/data/seed_tools.json';

if (!file_exists($sqlitePath) || !file_exists($seedFile)) {
    echo "Files missing.\n";
    exit(1);
}

$db = new PDO("sqlite:" . $sqlitePath);
$db->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

// 1. Reset categories to defaults
$db->exec("DELETE FROM categories;");
$db->exec("INSERT INTO categories (id, parent_id, name, slug, icon) VALUES (1, NULL, 'Default Collection', 'default-collection', 'folder');");
$db->exec("INSERT INTO categories (id, parent_id, name, slug, icon) VALUES (2, NULL, 'From Zero to Hero', 'from-zero-to-hero', 'graduation-cap');");

// 2. Clear presets
$db->exec("DELETE FROM presets;");

// 3. Reset tools to exact seed
$db->exec("DELETE FROM tools;");
$toolsData = json_decode(file_get_contents($seedFile), true);
$insertStmt = $db->prepare("
    INSERT INTO tools (id, section, name, description, glsl, default_params, preview_main, markdown_doc, order_index, difficulty, challenge_json)
    VALUES (:id, :section, :name, :description, :glsl, :default_params, :preview_main, :markdown_doc, :order_index, :difficulty, :challenge_json)
");
foreach ($toolsData as $t) {
    $insertStmt->execute([
        ':id' => $t['id'],
        ':section' => $t['section'] ?? 'Uncategorized',
        ':name' => $t['name'],
        ':description' => $t['description'] ?? '',
        ':glsl' => $t['glsl'] ?? '',
        ':default_params' => isset($t['defaultParams']) ? json_encode($t['defaultParams']) : '{}',
        ':preview_main' => $t['previewMain'] ?? '',
        ':markdown_doc' => $t['markdownDoc'] ?? '',
        ':order_index' => $t['orderIndex'] ?? 0,
        ':difficulty' => $t['difficulty'] ?? 'Beginner',
        ':challenge_json' => isset($t['challenge']) ? json_encode($t['challenge']) : '{}'
    ]);
}
echo "Database successfully reset to clean seed state.\n";
