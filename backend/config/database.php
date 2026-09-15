<?php
class Database {
    private $host = '127.0.0.1';
    private $db_name = 'shaders_toolbox';
    private $username = 'root';
    private $password = '';
    public $conn;

    public function getConnection() {
        $this->conn = null;
        try {
            $dsn = "mysql:host=" . $this->host . ";dbname=" . $this->db_name . ";charset=utf8mb4";
            $this->conn = new PDO($dsn, $this->username, $this->password);
            $this->conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
            $this->initializeTables();
        } catch(PDOException $mysql_exception) {
            try {
                $sqlitePath = __DIR__ . '/../database.sqlite';
                $this->conn = new PDO("sqlite:" . $sqlitePath);
                $this->conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
                $this->initializeTables();
            } catch(PDOException $sqlite_exception) {
                echo json_encode(["error" => "Database connection failed: " . $sqlite_exception->getMessage()]);
                exit();
            }
        }
        return $this->conn;
    }

    private function initializeTables() {
        // Categories / Folders table
        $this->conn->exec("CREATE TABLE IF NOT EXISTS categories (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            parent_id INTEGER DEFAULT NULL,
            name TEXT NOT NULL,
            slug TEXT NOT NULL,
            icon TEXT DEFAULT 'folder',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );");

        // Presets table with markdown_doc, difficulty, order_index
        $this->conn->exec("CREATE TABLE IF NOT EXISTS presets (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            category_id INTEGER DEFAULT NULL,
            name TEXT NOT NULL,
            description TEXT,
            glsl_code TEXT NOT NULL,
            markdown_doc TEXT DEFAULT '',
            difficulty TEXT DEFAULT 'Beginner',
            order_index INTEGER DEFAULT 0,
            challenge_json TEXT DEFAULT '',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );");

        // Tools table (Data-Driven Architecture)
        $this->conn->exec("CREATE TABLE IF NOT EXISTS tools (
            id TEXT PRIMARY KEY,
            section TEXT NOT NULL,
            name TEXT NOT NULL,
            description TEXT,
            glsl TEXT NOT NULL,
            default_params TEXT DEFAULT '{}',
            preview_main TEXT NOT NULL,
            markdown_doc TEXT DEFAULT '',
            order_index INTEGER DEFAULT 0,
            difficulty TEXT DEFAULT 'Beginner',
            challenge_json TEXT DEFAULT '{}',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );");

        // Try adding any new columns if table already exists
        try { $this->conn->exec("ALTER TABLE presets ADD COLUMN markdown_doc TEXT DEFAULT '';"); } catch(Exception $e) {}
        try { $this->conn->exec("ALTER TABLE presets ADD COLUMN difficulty TEXT DEFAULT 'Beginner';"); } catch(Exception $e) {}
        try { $this->conn->exec("ALTER TABLE presets ADD COLUMN order_index INTEGER DEFAULT 0;"); } catch(Exception $e) {}
        try { $this->conn->exec("ALTER TABLE presets ADD COLUMN challenge_json TEXT DEFAULT '';"); } catch(Exception $e) {}

        // Seed Tools table if empty
        $stmtTools = $this->conn->prepare("SELECT COUNT(*) FROM tools");
        $stmtTools->execute();
        $toolCount = (int)$stmtTools->fetchColumn();

        if ($toolCount === 0) {
            $seedFile = __DIR__ . '/../data/seed_tools.json';
            if (file_exists($seedFile)) {
                $toolsData = json_decode(file_get_contents($seedFile), true);
                if (is_array($toolsData)) {
                    $insertStmt = $this->conn->prepare("
                        INSERT INTO tools (id, section, name, description, glsl, default_params, preview_main, markdown_doc, order_index, difficulty, challenge_json)
                        VALUES (:id, :section, :name, :description, :glsl, :default_params, :preview_main, :markdown_doc, :order_index, :difficulty, :challenge_json)
                    ");
                    foreach ($toolsData as $t) {
                        $defaultParams = isset($t['defaultParams']) ? json_encode($t['defaultParams']) : '{}';
                        $challengeJson = isset($t['challenge']) ? json_encode($t['challenge']) : '{}';
                        $insertStmt->execute([
                            ':id' => $t['id'],
                            ':section' => $t['section'] ?? 'Uncategorized',
                            ':name' => $t['name'],
                            ':description' => $t['description'] ?? '',
                            ':glsl' => $t['glsl'] ?? '',
                            ':default_params' => $defaultParams,
                            ':preview_main' => $t['previewMain'] ?? '',
                            ':markdown_doc' => $t['markdownDoc'] ?? '',
                            ':order_index' => $t['orderIndex'] ?? 0,
                            ':difficulty' => $t['difficulty'] ?? 'Beginner',
                            ':challenge_json' => $challengeJson
                        ]);
                    }
                }
            }
        }

        // Deduplicate categories by slug and remove redundant entries
        try {
            $this->conn->exec("DELETE FROM categories WHERE id NOT IN (SELECT MIN(id) FROM categories GROUP BY slug);");
        } catch(Exception $e) {}

        // Seed "From Zero to Hero" category if missing
        $stmt = $this->conn->prepare("SELECT id FROM categories WHERE slug = 'from-zero-to-hero'");
        $stmt->execute();
        $zeroHeroId = $stmt->fetchColumn();

        if (!$zeroHeroId) {
            $this->conn->exec("INSERT INTO categories (name, slug, icon) VALUES ('From Zero to Hero', 'from-zero-to-hero', 'graduation-cap');");
        }

        // Seed default folder if missing
        $stmt2 = $this->conn->prepare("SELECT id FROM categories WHERE slug = 'default-collection'");
        $stmt2->execute();
        $defaultId = $stmt2->fetchColumn();
        if (!$defaultId) {
            $this->conn->exec("INSERT INTO categories (name, slug, icon) VALUES ('Default Collection', 'default-collection', 'folder');");
        }
    }
}
?>
