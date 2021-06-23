import {QueryExecutionId} from "aws-sdk/clients/athena";
import {executeQueries, Query} from "../lib/query";
import {athenaForRole} from "../lib/athena";

class Config {
    AthenaOutputBucket: string = process.env.AthenaOutputBucket;
    SchemaName: string = process.env.SchemaName;
    AthenaRole: string = process.env.AthenaRole;
}

const config = new Config();

const subscriptionsQuery =
    "SELECT " +
    "  COUNT(DISTINCT identity_id) " +
    "  FROM clean.subscriptions " +
    "WHERE " +
    "  sold_to_country = 'Australia' " +
    "  AND status = 'active' " +
    "  AND (product_name IN ('Supporter','Partner','Patron','Contributor','Newspaper Delivery','Newspaper Voucher','Digital Pack') or product_name LIKE '%Weekly%')";

const singleContributionsQuery =
    "SELECT " +
    "  COUNT(DISTINCT browser_id) AS cons " +
    "  FROM clean.acquisitions_no_pageview_data " +
    "WHERE " +
    "  received_date >= DATE '2020-07-19' " +
    "  AND country_code = 'AU' " +
    "  AND product = 'CONTRIBUTION'";

export async function handler(): Promise<QueryExecutionId[]> {
    const queries = [
        new Query(subscriptionsQuery, 'aus_supporters__subscriptions'),
        new Query(singleContributionsQuery, 'aus_supporters__single_contributions')
    ];

    return athenaForRole(config.AthenaRole, 'ophan')
        .then(athena => executeQueries(queries, config.AthenaOutputBucket, config.SchemaName, athena));
}
