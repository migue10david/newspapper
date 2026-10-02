CREATE TABLE "reading_history" (
	"user_id" uuid NOT NULL,
	"news_id" uuid NOT NULL,
	"last_read_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "reading_history_user_id_news_id_pk" PRIMARY KEY("user_id","news_id")
);
--> statement-breakpoint
CREATE TABLE "saved_news" (
	"user_id" uuid NOT NULL,
	"news_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "saved_news_user_id_news_id_pk" PRIMARY KEY("user_id","news_id")
);
--> statement-breakpoint
ALTER TABLE "reading_history" ADD CONSTRAINT "reading_history_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reading_history" ADD CONSTRAINT "reading_history_news_id_news_id_fk" FOREIGN KEY ("news_id") REFERENCES "public"."news"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "saved_news" ADD CONSTRAINT "saved_news_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "saved_news" ADD CONSTRAINT "saved_news_news_id_news_id_fk" FOREIGN KEY ("news_id") REFERENCES "public"."news"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "reading_history_user_last_read_at_idx" ON "reading_history" USING btree ("user_id","last_read_at");--> statement-breakpoint
CREATE INDEX "reading_history_news_id_idx" ON "reading_history" USING btree ("news_id");--> statement-breakpoint
CREATE INDEX "saved_news_user_created_at_idx" ON "saved_news" USING btree ("user_id","created_at");--> statement-breakpoint
CREATE INDEX "saved_news_news_id_idx" ON "saved_news" USING btree ("news_id");