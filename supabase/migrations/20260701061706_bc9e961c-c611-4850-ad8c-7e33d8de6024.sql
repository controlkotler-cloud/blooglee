DELETE FROM article_email_notifications WHERE article_id='921ece02-cb83-45f2-acff-7875e91854c3';
DELETE FROM articles WHERE id='921ece02-cb83-45f2-acff-7875e91854c3';
DELETE FROM site_activity_log WHERE action_type='autopublish_reconcile_failed' AND (metadata->>'article_id')='921ece02-cb83-45f2-acff-7875e91854c3';