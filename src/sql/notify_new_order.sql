CREATE OR REPLACE FUNCTION notify_new_order()
  RETURNS trigger AS
$BODY$
    BEGIN
        PERFORM pg_notify('new_order', row_to_json(NEW)::text);
        RETURN NULL;
    END; 
$BODY$
  LANGUAGE plpgsql VOLATILE
  COST 100;

---------------------------------------------------------------
CREATE TRIGGER notify_new_order
  AFTER INSERT OR UPDATE
  ON "tbl_orders"
  FOR EACH ROW
  EXECUTE PROCEDURE notify_new_order();