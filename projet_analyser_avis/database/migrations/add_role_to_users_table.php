
schema::table('users', function (Blueprint $table) {
    $table->string('role')->default('user');
});