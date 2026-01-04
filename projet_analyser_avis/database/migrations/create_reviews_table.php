
Schema::create('reviews', function (Blueprint $table) {
    $table->id(); 
    $table->foreignId('user_id')->constrained(); 
    $table->text('content'); 
    $table->string('sentiment'); 
    $table->integer('score'); 
    $table->json('topics'); 
    $table->timestamps(); 
});