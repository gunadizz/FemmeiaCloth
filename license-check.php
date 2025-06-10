<?php
header('Content-Type: application/json');

// Simulasi database license
$licenses = [
    "FS-2025-0610-001" => [
        "allowed_domain" => "iftitah.com",
        "license_hash" => "c2b7e5e23fc8614c2442e4c38b02e58173126848f3e547f03b2ad2b9d0be7a4a"
    ]
];

// Ambil parameter dari URL
$license_no = $_GET['license_no'] ?? '';
$domain = $_GET['domain'] ?? '';
$license_hash = $_GET['license_hash'] ?? '';

// Cek license
if (isset($licenses[$license_no])) {
    $license = $licenses[$license_no];
    
    if ($license['allowed_domain'] !== $domain) {
        echo json_encode([
            "status" => "invalid",
            "reason" => "domain mismatch"
        ]);
        exit;
    }
    
    if ($license['license_hash'] !== $license_hash) {
        echo json_encode([
            "status" => "invalid",
            "reason" => "license hash mismatch"
        ]);
        exit;
    }
    
    // Valid
    echo json_encode([
        "status" => "valid"
    ]);
    exit;
}

// License tidak ditemukan
echo json_encode([
    "status" => "invalid",
    "reason" => "license not found"
]);
exit;
?>
