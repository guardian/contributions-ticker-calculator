import {QueryExecutionId} from "aws-sdk/clients/athena";
import {executeQueries, Query} from "../lib/query";

class Config {
    AthenaOutputBucket: string = process.env.AthenaOutputBucket;
    SchemaName: string = process.env.SchemaName;
}

const config = new Config();

const subscriptionsQuery =
    "SELECT\n" +
    "  COUNT(DISTINCT identity_id)\n" +
    "  FROM clean.subscriptions\n" +
    "WHERE\n" +
    "  sold_to_country = 'Australia'\n" +
    "  AND status = 'active'\n" +
    "  AND (product_name IN ('Supporter','Partner','Patron','Contributor','Newspaper Delivery','Newspaper Voucher','Digital Pack') or product_name LIKE '%Weekly%')";

const singleContributionsQuery =
    "SELECT \n" +
    "  COUNT(DISTINCT browser_id) AS cons\n" +
    "  FROM clean.acquisitions_no_pageview_data\n" +
    "WHERE\n" +
    "  received_date >= DATE '2019-05-01'\n" +
    "  AND country_code = 'AU'\n" +
    "  AND product = 'CONTRIBUTION'";

export async function handler(): Promise<QueryExecutionId[]> {
    const queries = [
        new Query(subscriptionsQuery, 'aus_supporters__subscriptions'),
        new Query(singleContributionsQuery, 'aus_supporters__single_contributions')
    ];

    return executeQueries(queries, config.AthenaOutputBucket, config.SchemaName);
}
