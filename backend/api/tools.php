<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

if (file_exists(__DIR__ . '/config/database.php')) {
    require_once __DIR__ . '/config/database.php';
} else {
    require_once __DIR__ . '/../config/database.php';
}

$database = new Database();
$db = $database->getConnection();

$method = $_SERVER['REQUEST_METHOD'];

function formatToolResponse($row) {
    return [
        'id' => $row['id'],
        'section' => $row['section'],
        'name' => $row['name'],
        'description' => $row['description'] ?? '',
        'glsl' => $row['glsl'] ?? '',
        'defaultParams' => !empty($row['default_params']) ? json_decode($row['default_params'], true) : new stdClass(),
        'previewMain' => $row['preview_main'] ?? '',
        'markdownDoc' => $row['markdown_doc'] ?? '',
        'orderIndex' => isset($row['order_index']) ? intval($row['order_index']) : 0,
        'difficulty' => $row['difficulty'] ?? 'Beginner',
        'challenge' => !empty($row['challenge_json']) ? json_decode($row['challenge_json'], true) : [
            'prompt' => '',
            'hint' => '',
            'solution' => ''
        ],
        'created_at' => $row['created_at'] ?? null,
        'updated_at' => $row['updated_at'] ?? null
    ];
}

function slugify($text) {
    $text = preg_replace('~[^\pL\d]+~u', '-', $text);
    $text = iconv('utf-8', 'us-ascii//TRANSLIT', $text);
    $text = preg_replace('~[^-\w]+~', '', $text);
    $text = trim($text, '-');
    $text = preg_replace('~-+~', '-', $text);
    $text = strtolower($text);
    return empty($text) ? 'tool-' . time() : $text;
}

if ($method === 'GET') {
    $id = $_GET['id'] ?? null;
    $section = $_GET['section'] ?? null;
    $difficulty = $_GET['difficulty'] ?? null;

    if ($id) {
        $stmt = $db->prepare("SELECT * FROM tools WHERE id = :id LIMIT 1");
        $stmt->execute([':id' => $id]);
        $row = $stmt->fetch(PDO::FETCH_ASSOC);
        if ($row) {
            echo json_encode(formatToolResponse($row));
        } else {
            http_response_code(404);
            echo json_encode(["message" => "Tool not found."]);
        }
        exit();
    }

    $query = "SELECT * FROM tools WHERE 1=1";
    $params = [];

    if ($section) {
        $query .= " AND section = :section";
        $params[':section'] = $section;
    }
    if ($difficulty) {
        $query .= " AND difficulty = :difficulty";
        $params[':difficulty'] = $difficulty;
    }

    $query .= " ORDER BY order_index ASC, id ASC";
    $stmt = $db->prepare($query);
    $stmt->execute($params);
    $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

    $tools = array_map('formatToolResponse', $rows);
    echo json_encode($tools);

} elseif ($method === 'POST') {
    $data = json_decode(file_get_contents("php://input"), true);

    if (empty($data['name'])) {
        http_response_code(400);
        echo json_encode(["message" => "Tool name is required."]);
        exit();
    }

    // Determine ID/slug
    $id = !empty($data['id']) ? trim($data['id']) : slugify($data['name']);
    // Check collision and suffix if needed
    $checkStmt = $db->prepare("SELECT id FROM tools WHERE id = :id");
    $checkStmt->execute([':id' => $id]);
    if ($checkStmt->fetch()) {
        $id = $id . '-' . substr(uniqid(), -4);
    }

    // Determine order_index
    if (isset($data['orderIndex'])) {
        $orderIndex = intval($data['orderIndex']);
    } else {
        $maxStmt = $db->query("SELECT MAX(order_index) FROM tools");
        $maxOrder = $maxStmt->fetchColumn();
        $orderIndex = ($maxOrder !== false) ? ((int)$maxOrder) + 1 : 1;
    }

    $section = !empty($data['section']) ? trim($data['section']) : 'Custom Tools';
    $name = trim($data['name']);
    $description = $data['description'] ?? '';
    $glsl = $data['glsl'] ?? '';
    $previewMain = $data['previewMain'] ?? "void mainImage(out vec4 fragColor, in vec2 fragCoord) {\n  fragColor = vec4(0.2, 0.5, 0.8, 1.0);\n}";
    $markdownDoc = $data['markdownDoc'] ?? "# " . $name . "\n\nDocumentation for " . $name . ".";
    $difficulty = $data['difficulty'] ?? 'Beginner';
    $defaultParams = isset($data['defaultParams']) ? json_encode($data['defaultParams']) : '{}';
    $challengeJson = isset($data['challenge']) ? json_encode($data['challenge']) : '{}';

    $stmt = $db->prepare("
        INSERT INTO tools (id, section, name, description, glsl, default_params, preview_main, markdown_doc, order_index, difficulty, challenge_json)
        VALUES (:id, :section, :name, :description, :glsl, :default_params, :preview_main, :markdown_doc, :order_index, :difficulty, :challenge_json)
    ");

    $success = $stmt->execute([
        ':id' => $id,
        ':section' => $section,
        ':name' => $name,
        ':description' => $description,
        ':glsl' => $glsl,
        ':default_params' => $defaultParams,
        ':preview_main' => $previewMain,
        ':markdown_doc' => $markdownDoc,
        ':order_index' => $orderIndex,
        ':difficulty' => $difficulty,
        ':challenge_json' => $challengeJson
    ]);

    if ($success) {
        http_response_code(201);
        $fetchStmt = $db->prepare("SELECT * FROM tools WHERE id = :id");
        $fetchStmt->execute([':id' => $id]);
        echo json_encode([
            "message" => "Tool created successfully.",
            "tool" => formatToolResponse($fetchStmt->fetch(PDO::FETCH_ASSOC))
        ]);
    } else {
        http_response_code(503);
        echo json_encode(["message" => "Unable to create tool."]);
    }

} elseif ($method === 'PUT') {
    $data = json_decode(file_get_contents("php://input"), true);

    if (empty($data['id'])) {
        http_response_code(400);
        echo json_encode(["message" => "Tool ID is required for update."]);
        exit();
    }

    $id = trim($data['id']);

    // Check existing
    $checkStmt = $db->prepare("SELECT * FROM tools WHERE id = :id");
    $checkStmt->execute([':id' => $id]);
    $existing = $checkStmt->fetch(PDO::FETCH_ASSOC);

    if (!$existing) {
        http_response_code(404);
        echo json_encode(["message" => "Tool not found."]);
        exit();
    }

    $section = $data['section'] ?? $existing['section'];
    $name = $data['name'] ?? $existing['name'];
    $description = $data['description'] ?? $existing['description'];
    $glsl = $data['glsl'] ?? $existing['glsl'];
    $previewMain = $data['previewMain'] ?? $existing['preview_main'];
    $markdownDoc = $data['markdownDoc'] ?? $existing['markdown_doc'];
    $orderIndex = isset($data['orderIndex']) ? intval($data['orderIndex']) : $existing['order_index'];
    $difficulty = $data['difficulty'] ?? $existing['difficulty'];
    $defaultParams = isset($data['defaultParams']) ? json_encode($data['defaultParams']) : $existing['default_params'];
    $challengeJson = isset($data['challenge']) ? json_encode($data['challenge']) : $existing['challenge_json'];

    $stmt = $db->prepare("
        UPDATE tools SET
            section = :section,
            name = :name,
            description = :description,
            glsl = :glsl,
            default_params = :default_params,
            preview_main = :preview_main,
            markdown_doc = :markdown_doc,
            order_index = :order_index,
            difficulty = :difficulty,
            challenge_json = :challenge_json,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = :id
    ");

    $success = $stmt->execute([
        ':id' => $id,
        ':section' => $section,
        ':name' => $name,
        ':description' => $description,
        ':glsl' => $glsl,
        ':default_params' => $defaultParams,
        ':preview_main' => $previewMain,
        ':markdown_doc' => $markdownDoc,
        ':order_index' => $orderIndex,
        ':difficulty' => $difficulty,
        ':challenge_json' => $challengeJson
    ]);

    if ($success) {
        $fetchStmt = $db->prepare("SELECT * FROM tools WHERE id = :id");
        $fetchStmt->execute([':id' => $id]);
        echo json_encode([
            "message" => "Tool updated successfully.",
            "tool" => formatToolResponse($fetchStmt->fetch(PDO::FETCH_ASSOC))
        ]);
    } else {
        http_response_code(503);
        echo json_encode(["message" => "Unable to update tool."]);
    }

} elseif ($method === 'DELETE') {
    $id = $_GET['id'] ?? null;
    if (!$id) {
        $data = json_decode(file_get_contents("php://input"), true);
        $id = $data['id'] ?? null;
    }

    if (empty($id)) {
        http_response_code(400);
        echo json_encode(["message" => "Tool ID is required for deletion."]);
        exit();
    }

    $stmt = $db->prepare("DELETE FROM tools WHERE id = :id");
    if ($stmt->execute([':id' => $id])) {
        echo json_encode(["message" => "Tool deleted successfully.", "id" => $id]);
    } else {
        http_response_code(503);
        echo json_encode(["message" => "Unable to delete tool."]);
    }
}
?>
