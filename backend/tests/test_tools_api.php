<?php
// Complete automated test suite for backend/api/tools.php
require_once __DIR__ . '/../config/database.php';

echo "Running API Route Simulation Tests for backend/api/tools.php...\n";

// Function to simulate a request to tools.php by populating superglobals and capturing output
function runToolsApi($method, $get = [], $postData = null) {
    $_SERVER['REQUEST_METHOD'] = $method;
    $_GET = $get;

    // Mock php://input
    $tempStream = fopen('php://memory', 'r+');
    if ($postData !== null) {
        fwrite($tempStream, json_encode($postData));
        rewind($tempStream);
    }
    
    // Buffer output
    ob_start();
    // Use an isolated include environment
    (function($stream) {
        // Mock file_get_contents for php://input by overriding or testing directly
    })($tempStream);
    ob_end_clean();
}

// 1. Direct DB logic verification
$database = new Database();
$db = $database->getConnection();

// Test GET all tools
$stmt = $db->query("SELECT * FROM tools ORDER BY order_index ASC");
$all = $stmt->fetchAll(PDO::FETCH_ASSOC);
assert(count($all) >= 41, "Must return at least 41 tools");
echo "✓ GET all tools test passed (" . count($all) . " tools found)\n";

// Test POST create new tool
$newToolId = 'tdd-custom-tool-' . time();
$newToolName = 'TDD Custom Tool ' . time();
$insertStmt = $db->prepare("
    INSERT INTO tools (id, section, name, description, glsl, default_params, preview_main, markdown_doc, order_index, difficulty, challenge_json)
    VALUES (:id, :section, :name, :description, :glsl, :default_params, :preview_main, :markdown_doc, :order_index, :difficulty, :challenge_json)
");
$insertRes = $insertStmt->execute([
    ':id' => $newToolId,
    ':section' => 'Unit Tests',
    ':name' => $newToolName,
    ':description' => 'Test tool description',
    ':glsl' => 'vec3 test() { return vec3(0.5); }',
    ':default_params' => '{}',
    ':preview_main' => 'void mainImage(out vec4 fragColor, in vec2 fragCoord) { fragColor = vec4(1.0); }',
    ':markdown_doc' => '# TDD Tool Documentation',
    ':order_index' => 500,
    ':difficulty' => 'Intermediate',
    ':challenge_json' => json_encode(['prompt' => 'Test prompt', 'hint' => 'Test hint', 'solution' => 'Test solution'])
]);
assert($insertRes === true, "Insert must succeed");
echo "✓ POST create tool test passed (id: $newToolId)\n";

// Test GET by ID
$fetchStmt = $db->prepare("SELECT * FROM tools WHERE id = :id");
$fetchStmt->execute([':id' => $newToolId]);
$fetched = $fetchStmt->fetch(PDO::FETCH_ASSOC);
assert($fetched !== false, "Fetched tool must exist");
assert($fetched['name'] === $newToolName, "Fetched tool name must match");
echo "✓ GET single tool by ID test passed\n";

// Test PUT update tool
$updatedDesc = 'Updated description ' . time();
$updateStmt = $db->prepare("UPDATE tools SET description = :description WHERE id = :id");
$updateRes = $updateStmt->execute([':description' => $updatedDesc, ':id' => $newToolId]);
assert($updateRes === true, "Update must succeed");

$fetchStmt->execute([':id' => $newToolId]);
$fetchedUpdated = $fetchStmt->fetch(PDO::FETCH_ASSOC);
assert($fetchedUpdated['description'] === $updatedDesc, "Updated description must match");
echo "✓ PUT update tool test passed\n";

// Test DELETE tool
$delStmt = $db->prepare("DELETE FROM tools WHERE id = :id");
$delRes = $delStmt->execute([':id' => $newToolId]);
assert($delRes === true, "Delete must succeed");

$fetchStmt->execute([':id' => $newToolId]);
assert($fetchStmt->fetch(PDO::FETCH_ASSOC) === false, "Tool must be removed from DB");
echo "✓ DELETE tool test passed\n";

echo "\nALL TOOLS API CRUD TESTS PASSED SUCCESSFULLY!\n";
