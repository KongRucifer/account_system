# Database Schema - รายการ Tables และ Fields ทั้งหมด

**จำนวน Tables ทั้งหมด:** 98+ tables  
**ฐานข้อมูล:** develop_go  
**วันที่สร้าง:** May 15, 2026

---

## Table of Contents

1. [System & Reference Tables](#1-system--reference-tables)
2. [Client Management](#2-client-management)
3. [Account & Chart of Accounts](#3-account--chart-of-accounts)
4. [Transaction Tables](#4-transaction-tables)
5. [Loan Management](#5-loan-management)
6. [Savings & Equity](#6-savings--equity)
7. [NSO & Village Bank](#7-nso--village-bank)
8. [Committee & Asset](#8-committee--asset)
9. [Profit Distribution](#9-profit-distribution)
10. [Reports & EWS](#10-reports--ews)
11. [Other Tables](#11-other-tables)

---

## 1. System & Reference Tables

### 1.1 `account_owner`

| Column            | Type                           | Nullable   |
|-------------------|--------------------------------|------------|
| bankbooknumber    | character                      | NOT NULL   |
| acc_number        | character                      | NOT NULL   |
| client_id         | uuid                           | NOT NULL   |
| synchronized      | timestamp without time zone    | NULL       |
| need_sync         | character                      | NULL       |
| vbcode            | character                      | NOT NULL   |

### 1.2 `account_type`

| Column       | Type                     | Nullable   |
|--------------|--------------------------|------------|
| id           | character                | NOT NULL   |
| name_eng     | character varying        | NOT NULL   |
| name_lao     | character varying        | NOT NULL   |
| description  | character varying        | NULL       |
| need_sync    | character                | NULL       |

### 1.3 `status`

| Column     | Type                  | Nullable   |
|------------|-----------------------|------------|
| id         | character             | NOT NULL   |
| name_eng   | character varying     | NOT NULL   |
| name_lao   | character varying     | NOT NULL   |
| need_sync  | character             | NULL       |

### 1.4 `province`

| Column     | Type                  | Nullable   |
|------------|-----------------------|------------|
| id         | character             | NOT NULL   |
| name_eng   | character varying     | NOT NULL   |
| name_lao   | character varying     | NOT NULL   |
| need_sync  | character             | NULL       |

### 1.5 `district`

| Column       | Type                  | Nullable   |
|--------------|-----------------------|------------|
| id           | character             | NOT NULL   |
| name_eng     | character varying     | NOT NULL   |
| name_lao     | character varying     | NOT NULL   |
| province_id  | character             | NULL       |
| district_no  | character varying     | NULL       |
| need_sync    | character             | NULL       |

### 1.6 `countries`

| Column       | Type                  | Nullable   |
|--------------|-----------------------|------------|
| country_id   | character             | NOT NULL   |
| name_eng     | character varying     | NULL       |
| name_lao     | character varying     | NULL       |
| alpha2code   | character             | NULL       |
| alpha3code   | character             | NULL       |
| need_sync    | character             | NULL       |

### 1.7 `ethnicgroup`

| Column       | Type                  | Nullable   |
|--------------|-----------------------|------------|
| id           | character             | NOT NULL   |
| name_eng     | character varying     | NOT NULL   |
| name_lao     | character varying     | NOT NULL   |
| need_sync    | character             | NULL       |

### 1.8 `economic_status`

| Column       | Type                  | Nullable   |
|--------------|-----------------------|------------|
| id           | character             | NOT NULL   |
| name_eng     | character varying     | NOT NULL   |
| name_lao     | character varying     | NOT NULL   |
| need_sync    | character             | NULL       |

### 1.9 `profession`

| Column         | Type                  | Nullable   |
|----------------|-----------------------|------------|
| id             | character             | NOT NULL   |
| name_lao       | character varying     | NOT NULL   |
| name_eng       | character varying     | NOT NULL   |
| is_drop_down   | character             | NOT NULL   |
| need_sync      | character             | NULL       |

### 1.10 `jobtitle`

| Column    | Type              | Nullable   |
|-----------|-------------------|------------|
| id        | character         | NOT NULL   |
| name_eng  | character varying | NOT NULL   |
| name_lao  | character varying | NOT NULL   |
| need_sync | character         | NULL       |

### 1.11 `cny_lak_rate`

| Column       | Type      | Nullable   |
|--------------|-----------|------------|
| date         | date      | NOT NULL   |
| yuan_to_lak  | numeric   | NULL       |
| vbcode       | character | NOT NULL   |
| synchronized | character | NULL       |
| need_sync    | character | NULL       |

### 1.12 `vat`

| Column      | Type      | Nullable   |
|-------------|-----------|------------|
| id          | bigint    | NOT NULL   |
| vat_rate    | numeric   | NULL       |
| start_date  | date      | NULL       |
| end_date    | date      | NULL       |
| coutntry_id | character | NULL       |
| status      | character | NULL       |
| need_sync   | character | NULL       |

### 1.13 `system_setting`

| Column              | Type              | Nullable   |
|---------------------|-------------------|------------|
| id                  | character         | NOT NULL   |
| username            | character varying | NULL       |
| password            | character varying | NULL       |
| port                | character varying | NULL       |
| database_name       | character varying | NULL       |
| localhost           | character varying | NULL       |
| server_host         | character varying | NULL       |
| server_username     | character varying | NULL       |
| server_password     | character varying | NULL       |
| server_port         | character varying | NULL       |
| server_databasename | character varying | NULL       |
| need_sync           | character varying | NULL       |

### 1.14 `system_user`

| Column          | Type              | Nullable   |
|-----------------|-------------------|------------|
| id              | integer           | NOT NULL   |
| user_name       | character varying | NOT NULL   |
| nso_employee_id | character         | NULL       |
| status_id       | character         | NOT NULL   |
| need_sync       | character         | NULL       |
| password        | text              | NULL       |

### 1.15 `system_role`

| Column    | Type              | Nullable   |
|-----------|-------------------|------------|
| id        | character         | NOT NULL   |
| name_eng  | character varying | NOT NULL   |
| name_lao  | character varying | NOT NULL   |
| need_sync | character         | NULL       |

### 1.16 `system_user_role_matching`

| Column         | Type      | Nullable   |
|----------------|-----------|------------|
| system_role_id | character | NOT NULL   |
| system_user_id | integer   | NOT NULL   |
| need_sync      | character | NULL       |

### 1.17 `logging`

| Column         | Type                        | Nullable   |
|----------------|-----------------------------|------------|
| id             | integer                     | NOT NULL   |
| login_time     | timestamp without time zone | NOT NULL   |
| logout_time    | timestamp without time zone | NULL       |
| system_user_id | integer                     | NULL       |
| need_sync      | character                   | NULL       |

### 1.18 `refresh_token`

| Column         | Type                        | Nullable   |
|----------------|-----------------------------|------------|
| id             | uuid                        | NOT NULL   |
| bankbooknumber | character varying           | NOT NULL   |
| vbcode         | character varying           | NOT NULL   |
| token          | text                        | NOT NULL   |
| expires_at     | timestamp without time zone | NOT NULL   |
| created_at     | timestamp without time zone | NOT NULL   |
| revoked_at     | timestamp without time zone | NULL       |
| is_revoked     | boolean                     | NOT NULL   |
| ip_address     | character varying           | NULL       |
| user_agent     | text                        | NULL       |

### 1.19 `translation`

| Column    | Type              | Nullable   |
|-----------|-------------------|------------|
| id        | integer           | NOT NULL   |
| name_eng  | character varying | NOT NULL   |
| name_lao  | character varying | NOT NULL   |
| comment   | character varying | NULL       |
| need_sync | character         | NULL       |

### 1.20 `sync_info`

| Column                    | Type                        | Nullable   |
|---------------------------|-----------------------------|------------|
| id                        | integer                     | NULL       |
| list                      | character varying           | NULL       |
| synced_from_server        | boolean                     | NULL       |
| synced_from_server_record | bigint                      | NULL       |
| time_synced_from_server   | timestamp without time zone | NULL       |
| synced_to_server          | boolean                     | NULL       |
| synced_to_server_record   | bigint                      | NULL       |
| time_synced_to_server     | timestamp without time zone | NULL       |

---

## 2. Client Management

### 2.1 `client`

| Column             | Type                        | Nullable   |
|--------------------|-----------------------------|------------|
| id                 | uuid                        | NOT NULL   |
| bankbooknumber     | character                   | NULL       |
| firstname          | character varying           | NULL       |
| lastname           | character varying           | NULL       |
| nickname           | character varying           | NOT NULL   |
| gender_eng         | character varying           | NULL       |
| gender_lao         | character varying           | NULL       |
| birthdate          | date                        | NULL       |
| client_type        | character varying           | NOT NULL   |
| status_id          | character                   | NOT NULL   |
| email              | character varying           | NULL       |
| phonenumber        | character                   | NULL       |
| economic_status_id | character                   | NULL       |
| profession_id      | character                   | NULL       |
| beneficiary_lao    | character varying           | NULL       |
| vbcode             | character                   | NOT NULL   |
| sort_no            | character                   | NULL       |
| is_guarantor       | character                   | NULL       |
| guarantor_volume   | integer                     | NULL       |
| synchronized       | timestamp without time zone | NULL       |
| need_sync          | character                   | NULL       |
| civil_status_id    | character                   | NULL       |
| ethnic_id          | character                   | NULL       |

### 2.2 `client_account`

| Column         | Type              | Nullable   |
|----------------|-------------------|------------|
| bankbooknumber | character varying | NOT NULL   |
| vbcode         | character varying | NOT NULL   |
| username       | character varying | NOT NULL   |
| phone_number   | character varying | NULL       |
| password       | text              | NOT NULL   |

### 2.3 `id_document`

| Column               | Type              | Nullable   |
|----------------------|-------------------|------------|
| id                   | bigint            | NOT NULL   |
| document_name_lao    | character varying | NULL       |
| document_name_eng    | character varying | NULL       |
| iddocumentdate       | date              | NULL       |
| iddocmentnumber      | character varying | NULL       |
| fambook_indiv_number | character varying | NULL       |
| place_of_issue_eng   | character varying | NULL       |
| place_of_isue_lao    | character varying | NULL       |
| client_id            | uuid              | NOT NULL   |
| sort_no              | integer           | NULL       |
| vbcode               | character         | NULL       |
| need_sync            | character         | NULL       |
| change               | character         | NULL       |
| household_works      | character varying | NULL       |

### 2.4 `client_collateral_arrangement`

| Column                | Type                        | Nullable   |
|-----------------------|-----------------------------|------------|
| collateral_id         | bigint                      | NOT NULL   |
| collateral_name       | character varying           | NULL       |
| collateral_type       | character                   | NULL       |
| collateral_detail     | text                        | NULL       |
| collateral_value      | bigint                      | NULL       |
| identification_number | character varying           | NULL       |
| collateral_rate       | real                        | NULL       |
| value_for_loan        | bigint                      | NULL       |
| loan_account          | character                   | NOT NULL   |
| vbcode                | character                   | NOT NULL   |
| status_id             | character                   | NOT NULL   |
| vehicle_type          | character varying           | NULL       |
| vehicle_model         | character varying           | NULL       |
| saving_account        | character                   | NULL       |
| bankbooknumber        | character                   | NULL       |
| need_sync             | character                   | NULL       |
| last_update           | timestamp without time zone | NULL       |

---

## 3. Account & Chart of Accounts

### 3.1 `accounts`

| Column                 | Type                        | Nullable   |
|------------------------|-----------------------------|------------|
| acc_number             | character                   | NOT NULL   |
| acc_code               | character                   | NULL       |
| acc_code_id            | character                   | NULL       |
| acc_level              | character                   | NOT NULL   |
| acc_group              | character                   | NOT NULL   |
| acc_name_eng           | character varying           | NULL       |
| acc_name_lao           | character varying           | NULL       |
| bankbooknumber         | character                   | NULL       |
| acc_type_id            | character                   | NULL       |
| running_acc_no         | character                   | NULL       |
| balance_previous_date  | bigint                      | NULL       |
| total_amount_increase  | bigint                      | NULL       |
| total_amount_decrease  | bigint                      | NULL       |
| current_balance        | bigint                      | NOT NULL   |
| last_update            | date                        | NOT NULL   |
| status_id              | character                   | NOT NULL   |
| vbcode                 | character                   | NOT NULL   |
| opening_date           | date                        | NOT NULL   |
| closing_date           | date                        | NULL       |
| can_be_negative        | character                   | NULL       |
| acc_balanceside        | character                   | NULL       |
| is_balance_acc         | character                   | NULL       |
| parent_acc_code        | character                   | NULL       |
| parent_acc             | character                   | NULL       |
| receives_dividend      | character                   | NULL       |
| is_ledger              | character                   | NULL       |
| synchronized           | timestamp without time zone | NULL       |
| is_profit_and_loss_acc | character                   | NULL       |
| is_trial_balance_acc   | character                   | NULL       |
| pnl_category           | character                   | NULL       |
| ledgerposition         | character                   | NULL       |
| balanceposition        | character                   | NULL       |
| need_sync              | character                   | NULL       |
| restructuring_loan     | boolean                     | NULL       |

### 3.2 `chart_of_accounts`

| Column                 | Type                        | Nullable   |
|------------------------|-----------------------------|------------|
| acc_number             | character                   | NULL       |
| acc_code               | character                   | NOT NULL   |
| acc_code_id            | character                   | NOT NULL   |
| acc_level              | character varying           | NULL       |
| acc_group              | character                   | NOT NULL   |
| acc_name_eng           | character varying           | NOT NULL   |
| acc_name_lao           | character varying           | NOT NULL   |
| bankbook_no            | character                   | NULL       |
| acc_type_id            | character                   | NULL       |
| running_acc_no         | character                   | NULL       |
| balance_previous_date  | bigint                      | NULL       |
| total_amount_increase  | bigint                      | NULL       |
| total_amount_decrease  | bigint                      | NULL       |
| current_balance        | bigint                      | NULL       |
| last_update            | date                        | NULL       |
| status_id              | character                   | NOT NULL   |
| vb_code                | character                   | NULL       |
| opening_dete           | date                        | NULL       |
| closing_date           | date                        | NULL       |
| can_be_negative        | character                   | NULL       |
| acc_balanceside        | character                   | NOT NULL   |
| is_balance_acc         | character                   | NULL       |
| parent_acc_code        | character                   | NULL       |
| perent_acc             | character                   | NULL       |
| receives_dividend      | character                   | NULL       |
| is_ledger              | character                   | NULL       |
| synchronized           | timestamp without time zone | NULL       |
| is_profit_and_loss_acc | character                   | NULL       |
| is_trial_balance_acc   | character                   | NULL       |
| pnl_category           | character                   | NULL       |
| ledgerposition         | character                   | NULL       |
| balanceposition        | character                   | NULL       |
| need_sync              | character                   | NULL       |

### 3.3 `bank_saving_accounts`

| Column          | Type                        | Nullable   |
|-----------------|-----------------------------|------------|
| acc_number      | character                   | NOT NULL   |
| bank_acc_number | character varying           | NULL       |
| bank_id         | character varying           | NULL       |
| current_balance | bigint                      | NULL       |
| interest_rate   | real                        | NULL       |
| opening_date    | date                        | NULL       |
| saving_type_id  | character                   | NULL       |
| description     | character varying           | NULL       |
| status_id       | character                   | NULL       |
| vbcode          | character                   | NOT NULL   |
| need_sync       | character                   | NULL       |
| last_update     | timestamp without time zone | NULL       |
| acc_name        | character varying           | NULL       |

### 3.4 `bank`

| Column    | Type              | Nullable   |
|-----------|-------------------|------------|
| bank_id   | character varying | NOT NULL   |
| name_lao  | character varying | NULL       |
| name_eng  | character varying | NULL       |
| status_id | character varying | NULL       |

---

## 4. Transaction Tables

### 4.1 `transactions`

| Column              | Type                        | Nullable   |
|---------------------|-----------------------------|------------|
| id                  | uuid                        | NOT NULL   |
| date                | timestamp without time zone | NOT NULL   |
| bankbooknumber      | character                   | NULL       |
| transaction_code_id | character                   | NOT NULL   |
| amount              | bigint                      | NOT NULL   |
| debit_acc_number    | character                   | NOT NULL   |
| credit_acc_number   | character                   | NOT NULL   |
| user_id             | character varying           | NULL       |
| vbcode              | character                   | NOT NULL   |
| synchronized        | timestamp without time zone | NULL       |
| description         | character varying           | NULL       |
| need_sync           | character                   | NULL       |

### 4.2 `transaction_code`

| Column              | Type              | Nullable   |
|---------------------|-------------------|------------|
| transaction_code    | character         | NOT NULL   |
| name_eng            | character varying | NOT NULL   |
| name_lao            | character varying | NOT NULL   |
| debit_acc_number    | character         | NULL       |
| debit_acc_name_eng  | character varying | NOT NULL   |
| debit_acc_name_lao  | character varying | NULL       |
| credit_acc_number   | character         | NULL       |
| credit_acc_name_eng | character varying | NOT NULL   |
| credit_acc_name_lao | character varying | NULL       |
| acc_group           | character         | NOT NULL   |
| description         | character varying | NULL       |
| need_sync           | character         | NULL       |
| debit_change        | character         | NULL       |
| credit_change       | character         | NULL       |
| balance_changes     | character         | NULL       |

### 4.3 `transaction_code_temp`

| Column              | Type              | Nullable   |
|---------------------|-------------------|------------|
| transaction_code    | character         | NOT NULL   |
| name_eng            | character varying | NOT NULL   |
| name_lao            | character varying | NOT NULL   |
| debit_acc_number    | character         | NULL       |
| debit_acc_name_eng  | character varying | NOT NULL   |
| debit_acc_name_lao  | character varying | NULL       |
| credit_acc_number   | character         | NULL       |
| credit_acc_name_eng | character varying | NOT NULL   |
| credit_acc_name_lao | character varying | NULL       |
| acc_group           | character         | NOT NULL   |
| description         | character varying | NULL       |
| need_sync           | character         | NULL       |
| debit_change        | character         | NULL       |
| credit_change       | character         | NULL       |
| balance_changes     | character         | NULL       |

### 4.4 `balance`

| Column          | Type                        | Nullable   |
|-----------------|-----------------------------|------------|
| date            | timestamp without time zone | NOT NULL   |
| acc_number      | character                   | NOT NULL   |
| acc_name_eng    | character varying           | NOT NULL   |
| acc_name_lao    | character varying           | NOT NULL   |
| amount          | bigint                      | NOT NULL   |
| vbcode          | character                   | NOT NULL   |
| type            | character varying           | NULL       |
| synchronized    | timestamp without time zone | NULL       |
| balanceposition | character                   | NOT NULL   |
| need_sync       | character                   | NULL       |

### 4.5 `general_ledger`

| Column                | Type                        | Nullable   |
|-----------------------|-----------------------------|------------|
| date                  | timestamp without time zone | NOT NULL   |
| acc_number            | character                   | NOT NULL   |
| acc_name_eng          | character varying           | NOT NULL   |
| acc_name_lao          | character varying           | NOT NULL   |
| balance_previous_date | bigint                      | NULL       |
| total_amount_increase | bigint                      | NOT NULL   |
| total_amount_decrease | bigint                      | NOT NULL   |
| balance               | bigint                      | NOT NULL   |
| vbcode                | character                   | NOT NULL   |
| type                  | character varying           | NULL       |
| synchronized          | timestamp without time zone | NULL       |
| ledgerposition        | character                   | NULL       |
| need_sync             | character                   | NULL       |

### 4.6 `trial_balance`

| Column          | Type                        | Nullable   |
|-----------------|-----------------------------|------------|
| date            | timestamp without time zone | NOT NULL   |
| acc_number      | character                   | NOT NULL   |
| acc_name_eng    | character varying           | NOT NULL   |
| acc_name_lao    | character varying           | NOT NULL   |
| amount          | bigint                      | NOT NULL   |
| vbcode          | character                   | NOT NULL   |
| type            | character varying           | NULL       |
| synchronized    | timestamp without time zone | NULL       |
| balanceposition | character                   | NOT NULL   |
| need_sync       | character                   | NULL       |

### 4.7 `profit_and_loss`

| Column       | Type                        | Nullable   |
|--------------|-----------------------------|------------|
| date         | timestamp with time zone    | NOT NULL   |
| acc_number   | character                   | NOT NULL   |
| acc_name_eng | character varying           | NOT NULL   |
| acc_name_lao | character varying           | NOT NULL   |
| amount       | bigint                      | NOT NULL   |
| vbcode       | character                   | NOT NULL   |
| type         | character varying           | NULL       |
| synchronized | timestamp without time zone | NULL       |
| pnl_category | character                   | NULL       |
| need_sync    | character                   | NULL       |

### 4.8 `cash_book_view`

| Column          | Type                        | Nullable   |
|-----------------|-----------------------------|------------|
| id              | integer                     | NOT NULL   |
| date            | timestamp without time zone | NULL       |
| acc_number      | character                   | NULL       |
| income          | bigint                      | NULL       |
| expenses        | bigint                      | NULL       |
| balance         | bigint                      | NULL       |
| description     | character varying           | NULL       |
| vbcode          | character                   | NOT NULL   |
| nso_employee_id | character                   | NULL       |
| need_sync       | character                   | NULL       |
| last_update     | timestamp without time zone | NULL       |
| bankbooknumber  | character                   | NULL       |

---

## 5. Loan Management

### 5.1 `client_loan_arrangement`

| Column                        | Type                        | Nullable   |
|-------------------------------|-----------------------------|------------|
| id                            | bigint                      | NOT NULL   |
| date                          | date                        | NOT NULL   |
| acc_number                    | character                   | NOT NULL   |
| is_syndicated                 | character                   | NOT NULL   |
| client_loan_rule_id           | character varying           | NOT NULL   |
| client_loan_repayment_type_id | character                   | NOT NULL   |
| start_date                    | date                        | NOT NULL   |
| loan_period_months            | integer                     | NOT NULL   |
| end_date                      | date                        | NULL       |
| total_loan_amount             | bigint                      | NOT NULL   |
| loan_outstanding              | bigint                      | NOT NULL   |
| interest_due                  | bigint                      | NOT NULL   |
| interest_paid                 | bigint                      | NOT NULL   |
| interest_unpaid               | bigint                      | NOT NULL   |
| principal_due                 | bigint                      | NOT NULL   |
| principal_paid                | bigint                      | NOT NULL   |
| principal_unpaid              | bigint                      | NOT NULL   |
| principal_days_overdue        | bigint                      | NOT NULL   |
| interest_days_overdue         | bigint                      | NULL       |
| loan_writtenoff               | character                   | NOT NULL   |
| vbcode                        | character                   | NOT NULL   |
| status_id                     | character                   | NOT NULL   |
| synchronized                  | timestamp without time zone | NULL       |
| guarantor_client_id           | uuid                        | NULL       |
| need_sync                     | character                   | NULL       |
| client_loan_int_rate          | numeric                     | NULL       |
| monthly_interest_due          | bigint                      | NULL       |
| monthly_principal_due         | bigint                      | NULL       |
| interest_paid_this_month      | bigint                      | NULL       |
| subloan_id                    | character                   | NULL       |
| detail                        | character varying           | NULL       |

### 5.2 `client_loan_repayment_type`

| Column                  | Type              | Nullable   |
|-------------------------|-------------------|------------|
| id                      | character         | NOT NULL   |
| name_eng                | character varying | NOT NULL   |
| name_lao                | character varying | NOT NULL   |
| interest_interval_eng   | character varying | NOT NULL   |
| interest_interval_lao   | character varying | NOT NULL   |
| interest_period_month   | integer           | NOT NULL   |
| repayment_principal_eng | character varying | NOT NULL   |
| repayment_principal_lao | character varying | NOT NULL   |
| principal_period_month  | integer           | NOT NULL   |
| can_be_syndicated       | character         | NOT NULL   |
| need_sync               | character         | NULL       |

### 5.3 `client_loan_purpose`

| Column            | Type              | Nullable   |
|-------------------|-------------------|------------|
| id                | character         | NOT NULL   |
| name_eng          | character varying | NOT NULL   |
| name_lao          | character varying | NOT NULL   |
| can_be_syndicated | character         | NOT NULL   |
| need_sync         | character         | NULL       |

### 5.4 `client_loan_rule`

| Column                         | Type                        | Nullable   |
|--------------------------------|-----------------------------|------------|
| id                             | character varying           | NOT NULL   |
| client_loan_purpose_id         | character                   | NOT NULL   |
| vb_interest_rate_m             | numeric                     | NULL       |
| max_interest_m                 | numeric                     | NOT NULL   |
| vb_max_lending_period_m        | integer                     | NOT NULL   |
| vb_max_loan_amount             | bigint                      | NOT NULL   |
| max_loan_amount                | bigint                      | NOT NULL   |
| collateral_required            | character                   | NOT NULL   |
| vbcode                         | character                   | NOT NULL   |
| start_date                     | date                        | NOT NULL   |
| end_date                       | date                        | NULL       |
| status_id                      | character                   | NOT NULL   |
| synchronized                   | timestamp without time zone | NULL       |
| need_sync                      | character                   | NULL       |
| vb_max_installment_loan_period | integer                     | NULL       |
| user_id                        | character varying           | NULL       |

### 5.5 `client_installment_loan_plan`

| Column                     | Type                        | Nullable   |
|----------------------------|-----------------------------|------------|
| id                         | bigint                      | NOT NULL   |
| vbcode                     | character varying           | NOT NULL   |
| month_plan                 | date                        | NULL       |
| monthly_interest           | bigint                      | NULL       |
| monthly_interest_paid      | bigint                      | NULL       |
| monthly_interest_not_paid  | bigint                      | NULL       |
| monthly_principle          | bigint                      | NULL       |
| monthly_principle_paid     | bigint                      | NULL       |
| monthly_principle_not_paid | bigint                      | NULL       |
| acc_number                 | character varying           | NOT NULL   |
| running_month              | smallint                    | NULL       |
| need_sync                  | character                   | NULL       |
| synchronized               | timestamp without time zone | NULL       |

### 5.6 `client_loan_loss_provisoning`

| Column                                 | Type                        | Nullable   |
|----------------------------------------|-----------------------------|------------|
| id                                     | bigint                      | NOT NULL   |
| client_loan_loss_provisioning_model_id | character                   | NOT NULL   |
| date                                   | date                        | NOT NULL   |
| creditportfolio_total                  | bigint                      | NOT NULL   |
| creditportfolio_1t30                   | bigint                      | NOT NULL   |
| creditportfolio_91t180                 | bigint                      | NOT NULL   |
| creditportfolio_181                    | bigint                      | NOT NULL   |
| creditportfolio_non_perf_total         | bigint                      | NOT NULL   |
| creditportfolio_perf                   | bigint                      | NOT NULL   |
| needed_loan_loss_p_1_percent           | bigint                      | NOT NULL   |
| needed_loan_loss_p_25_percent          | bigint                      | NOT NULL   |
| needed_loan_loss_p_50_percent          | bigint                      | NOT NULL   |
| needed_loan_loss_p_100_percent         | bigint                      | NOT NULL   |
| needed_loan_loss_p_total               | bigint                      | NOT NULL   |
| loan_loss_p_1_booked                   | bigint                      | NOT NULL   |
| loan_loss_p_25_booked                  | bigint                      | NOT NULL   |
| loan_loss_p_50_booked                  | bigint                      | NOT NULL   |
| loan_loss_p_100_booked                 | bigint                      | NOT NULL   |
| loan_loss_p_increase                   | bigint                      | NULL       |
| loan_loss_p_decrease                   | bigint                      | NULL       |
| loan_loss_p_booked_total               | bigint                      | NOT NULL   |
| vbcode                                 | character                   | NOT NULL   |
| synchronized                           | timestamp without time zone | NULL       |
| need_sync                              | character                   | NULL       |
| creditportfolio_31t90                  | bigint                      | NULL       |
| one_percent_of_performing_portfolio    | bigint                      | NULL       |

### 5.7 `client_loan_lossprovisioning_model`

| Column                     | Type              | Nullable   |
|----------------------------|-------------------|------------|
| id                         | character         | NOT NULL   |
| name_eng                   | character varying | NOT NULL   |
| name_lao                   | character varying | NOT NULL   |
| gen_loan_loss_reserve_rate | numeric           | NOT NULL   |
| need_sync                  | character         | NULL       |

### 5.8 `sub_loan_detail`

| Column          | Type              | Nullable   |
|-----------------|-------------------|------------|
| id              | character         | NOT NULL   |
| loan_purpose_id | character         | NULL       |
| name_eng        | character varying | NULL       |
| name_lao        | character varying | NULL       |

---

## 6. Savings & Equity

### 6.1 `client_saving_arrangement`

| Column                     | Type                        | Nullable   |
|----------------------------|-----------------------------|------------|
| id                         | bigint                      | NOT NULL   |
| date                       | date                        | NULL       |
| current_balance            | bigint                      | NULL       |
| saving_amount              | bigint                      | NULL       |
| withdrawal_amount          | bigint                      | NULL       |
| vbcode                     | character                   | NOT NULL   |
| client_saving_condition_id | character                   | NULL       |
| acc_number                 | character                   | NULL       |
| interest_numerator         | bigint                      | NULL       |
| synchronized               | timestamp without time zone | NULL       |
| need_sync                  | character                   | NULL       |

### 6.2 `client_saving_condition`

| Column            | Type                        | Nullable   |
|-------------------|-----------------------------|------------|
| id                | character                   | NOT NULL   |
| entry_date        | timestamp without time zone | NULL       |
| description       | character varying           | NULL       |
| interest_rate_yn  | boolean                     | NULL       |
| max_saving_amount | bigint                      | NULL       |
| min_saving_amount | bigint                      | NULL       |
| vbcode            | character                   | NOT NULL   |
| start_date        | date                        | NOT NULL   |
| end_date          | date                        | NULL       |
| status_id         | character                   | NOT NULL   |
| synchronized      | timestamp without time zone | NULL       |
| need_sync         | character                   | NULL       |

### 6.3 `client_equity_saving_arrangement`

| Column                            | Type                        | Nullable   |
|-----------------------------------|-----------------------------|------------|
| id                                | bigint                      | NOT NULL   |
| acc_number                        | character                   | NOT NULL   |
| date                              | date                        | NOT NULL   |
| current_balance                   | bigint                      | NOT NULL   |
| saving_amount                     | bigint                      | NULL       |
| withdrawal_amount                 | bigint                      | NULL       |
| vbcode                            | character                   | NOT NULL   |
| interest_numerator                | bigint                      | NOT NULL   |
| client_equity_saving_condition_id | integer                     | NOT NULL   |
| synchronized                      | timestamp without time zone | NULL       |
| status_id                         | character                   | NOT NULL   |
| need_sync                         | character                   | NULL       |
| profit_amount                     | bigint                      | NULL       |
| transfer_in                       | bigint                      | NULL       |
| transfer_out                      | bigint                      | NULL       |

### 6.4 `nso_shares`

| Column                | Type                        | Nullable   |
|-----------------------|-----------------------------|------------|
| date                  | date                        | NOT NULL   |
| acc_number            | character                   | NOT NULL   |
| share_balance         | bigint                      | NOT NULL   |
| share_purchase_amount | bigint                      | NOT NULL   |
| share_sold_amount     | bigint                      | NOT NULL   |
| vbcode                | character                   | NOT NULL   |
| synchronized          | timestamp without time zone | NULL       |
| need_sync             | character                   | NULL       |

### 6.5 `vb_nso_saving_arrangement`

| Column                     | Type                        | Nullable   |
|----------------------------|-----------------------------|------------|
| id                         | bigint                      | NOT NULL   |
| acc_number                 | character                   | NOT NULL   |
| date                       | date                        | NOT NULL   |
| vb_nso_saving_condition_id | integer                     | NOT NULL   |
| start_date                 | date                        | NOT NULL   |
| end_date                   | date                        | NULL       |
| saving_period_months       | bigint                      | NOT NULL   |
| interest_rate_peryear      | numeric                     | NOT NULL   |
| initial_amount             | bigint                      | NOT NULL   |
| saving_amount              | bigint                      | NULL       |
| withdrawal_amount          | bigint                      | NULL       |
| interest_numerator         | bigint                      | NOT NULL   |
| interest_paid              | bigint                      | NOT NULL   |
| balance                    | bigint                      | NOT NULL   |
| vbcode                     | character                   | NOT NULL   |
| status_id                  | character                   | NOT NULL   |
| synchronized               | timestamp without time zone | NULL       |
| need_sync                  | character                   | NULL       |
| saving_interest            | bigint                      | NULL       |
| special                    | boolean                     | NULL       |

### 6.6 `vb_nso_saving_conditions`

| Column                | Type      | Nullable   |
|-----------------------|-----------|------------|
| id                    | integer   | NOT NULL   |
| vb_nso_saving_type_id | integer   | NOT NULL   |
| interest_rate_y       | numeric   | NOT NULL   |
| max_saving_amount     | bigint    | NULL       |
| start_date            | date      | NOT NULL   |
| end_date              | date      | NULL       |
| status_id             | character | NOT NULL   |
| need_sync             | character | NULL       |

### 6.7 `vb_nso_saving_type`

| Column               | Type              | Nullable   |
|----------------------|-------------------|------------|
| id                   | integer           | NOT NULL   |
| name_eng             | character varying | NOT NULL   |
| name_lao             | character varying | NOT NULL   |
| saving_period_months | integer           | NOT NULL   |
| need_sync            | character         | NULL       |

### 6.8 `nso_vb_wsloan_arrangement`

| Column                     | Type                        | Nullable   |
|----------------------------|-----------------------------|------------|
| id                         | bigint                      | NOT NULL   |
| acc_number                 | character                   | NULL       |
| nso_vb_wsloan_condition_id | integer                     | NOT NULL   |
| initial_amount             | bigint                      | NOT NULL   |
| max_initial_amount         | bigint                      | NOT NULL   |
| wsloan_period_months       | integer                     | NOT NULL   |
| start_date                 | date                        | NOT NULL   |
| end_date                   | date                        | NOT NULL   |
| principal_amount_due       | bigint                      | NULL       |
| individual_amount_repaid   | bigint                      | NULL       |
| total_amount_repaid        | bigint                      | NULL       |
| interest_numerator         | bigint                      | NOT NULL   |
| interest_due               | bigint                      | NOT NULL   |
| interest_paid              | bigint                      | NOT NULL   |
| interest_not_paid          | bigint                      | NOT NULL   |
| balance                    | bigint                      | NOT NULL   |
| total_amount_overdue       | bigint                      | NULL       |
| vbcode                     | character                   | NOT NULL   |
| status_id                  | character                   | NOT NULL   |
| synchronized               | timestamp without time zone | NULL       |
| need_sync                  | character                   | NULL       |
| monthly_interest_due       | bigint                      | NULL       |
| more_loan                  | bigint                      | NULL       |

### 6.9 `nso_vb_wsloan_condition`

| Column          | Type      | Nullable   |
|-----------------|-----------|------------|
| id              | integer   | NOT NULL   |
| interest_rate_m | numeric   | NOT NULL   |
| start_date      | date      | NOT NULL   |
| end_date        | date      | NULL       |
| status_id       | character | NOT NULL   |
| need_sync       | character | NULL       |
| calculate_daily | boolean   | NULL       |

---

## 7. NSO & Village Bank

### 7.1 `nso`

| Column                     | Type              | Nullable   |
|----------------------------|-------------------|------------|
| id                         | character         | NOT NULL   |
| licensingform_eng          | character varying | NULL       |
| licensingform_lao          | character varying | NULL       |
| nso_name_eng               | character varying | NULL       |
| nso_name_lao               | character varying | NULL       |
| adressline_eng             | character varying | NULL       |
| adressline_lao             | character varying | NULL       |
| adresscity_eng             | character varying | NULL       |
| adresscity_lao             | character varying | NULL       |
| province_id                | character         | NULL       |
| district_id                | character         | NULL       |
| country_id                 | character         | NULL       |
| status_id                  | character         | NULL       |
| distr_key_vb_fund_min      | numeric           | NULL       |
| distr_key_vb_fund_max      | numeric           | NULL       |
| distr_key_reserve_min      | numeric           | NULL       |
| distr_key_vb_committee_min | numeric           | NULL       |
| distr_key_vb_committee_max | numeric           | NULL       |
| need_sync                  | character         | NULL       |
| distr_key_vb_welfare_min   | numeric           | NULL       |

### 7.2 `nso_office`

| Column       | Type              | Nullable   |
|--------------|-------------------|------------|
| id           | character         | NOT NULL   |
| office_no    | character varying | NULL       |
| province_id  | character         | NULL       |
| district_id  | character         | NULL       |
| location_eng | character varying | NULL       |
| location_lao | character varying | NULL       |
| nso_id       | character         | NULL       |
| status_id    | character         | NULL       |
| need_sync    | character         | NULL       |

### 7.3 `nso_employee`

| Column        | Type              | Nullable   |
|---------------|-------------------|------------|
| id            | character         | NOT NULL   |
| empl_no       | character varying | NULL       |
| user_name     | character varying | NULL       |
| nso_id        | character         | NULL       |
| nso_office_id | character         | NULL       |
| firstname_eng | character varying | NULL       |
| lastname_eng  | character varying | NULL       |
| firstname_lao | character varying | NULL       |
| lastname_lao  | character varying | NULL       |
| birthdate     | date              | NULL       |
| birthplace    | character varying | NULL       |
| gender_eng    | character varying | NULL       |
| gender_lao    | character varying | NULL       |
| hiredate      | date              | NULL       |
| date_left     | date              | NULL       |
| phone         | character varying | NULL       |
| status_id     | character         | NULL       |
| gross_salary  | bigint            | NULL       |
| email         | character varying | NULL       |
| jobtitle_id_1 | character         | NULL       |
| jobtitle_id_2 | character         | NULL       |
| bankaccount   | character varying | NULL       |
| bankname      | character varying | NULL       |
| country_id    | character         | NULL       |
| need_sync     | character         | NULL       |
| years         | integer           | NULL       |

### 7.4 `nso_fee_model`

| Column         | Type      | Nullable   |
|----------------|-----------|------------|
| id             | character | NOT NULL   |
| nso_yearlyfee  | bigint    | NULL       |
| nso_monthlyfee | bigint    | NULL       |
| is_capped      | boolean   | NULL       |
| start_date     | date      | NOT NULL   |
| end_date       | date      | NULL       |
| nso_id         | character | NULL       |
| status_id      | character | NULL       |
| need_sync      | character | NULL       |

### 7.5 `nso_fee_transaction`

| Column                              | Type                        | Nullable   |
|-------------------------------------|-----------------------------|------------|
| id                                  | bigint                      | NOT NULL   |
| date                                | date                        | NOT NULL   |
| nso_fee_model_id                    | character                   | NULL       |
| total_outstanding_loan              | bigint                      | NULL       |
| wsl_from_nso                        | bigint                      | NULL       |
| outstandingloan_minus_wsl           | bigint                      | NULL       |
| nso_fee_due_this_month              | bigint                      | NULL       |
| nso_fee_due_accum_current_bus_year  | bigint                      | NULL       |
| nso_fee_paid_this_month             | bigint                      | NULL       |
| nso_fee_paid_accum_current_bus_year | bigint                      | NULL       |
| nso_fee_unpaid                      | bigint                      | NULL       |
| vbcode                              | character                   | NULL       |
| synchronized                        | timestamp without time zone | NULL       |
| need_sync                           | character                   | NULL       |
| nso_vat                             | bigint                      | NULL       |
| nso_fee_due                         | bigint                      | NULL       |
| nso_vat_this_month                  | bigint                      | NULL       |
| nso_id                              | character                   | NULL       |

### 7.6 `vbcode`

| Column      | Type              | Nullable   |
|-------------|-------------------|------------|
| id          | character         | NOT NULL   |
| province_id | character         | NOT NULL   |
| district_id | character         | NOT NULL   |
| village_id  | character         | NOT NULL   |
| name_eng    | character varying | NOT NULL   |
| name_lao    | character varying | NOT NULL   |
| need_sync   | character         | NULL       |
| vb_id_old   | character         | NULL       |

### 7.7 `vbcode2`

| Column      | Type              | Nullable   |
|-------------|-------------------|------------|
| id          | character         | NOT NULL   |
| province_id | character         | NOT NULL   |
| district_id | character         | NOT NULL   |
| village_id  | character         | NOT NULL   |
| name_eng    | character varying | NOT NULL   |
| name_lao    | character varying | NOT NULL   |
| need_sync   | character         | NULL       |
| vb_id_old   | character         | NULL       |

### 7.8 `villagebank`

| Column                      | Type                        | Nullable   |
|-----------------------------|-----------------------------|------------|
| vbcode                      | character                   | NOT NULL   |
| foundingdate                | date                        | NOT NULL   |
| name_eng                    | character varying           | NOT NULL   |
| name_lao                    | character varying           | NOT NULL   |
| startmonthbusinessyear      | integer                     | NOT NULL   |
| monthlymeetingdate          | integer                     | NOT NULL   |
| monthlymeetingdate_duration | integer                     | NOT NULL   |
| minimum_saving              | integer                     | NOT NULL   |
| maximum_saving              | bigint                      | NULL       |
| currency                    | character                   | NOT NULL   |
| nso_office_id               | character                   | NOT NULL   |
| status_id                   | character                   | NOT NULL   |
| equity_saving_only          | character                   | NOT NULL   |
| synchronized                | timestamp without time zone | NULL       |
| need_sync                   | character                   | NULL       |
| vb_id_old                   | character                   | NULL       |
| except_fee                  | character                   | NULL       |

### 7.9 `village`

| Column           | Type                        | Nullable   |
|------------------|-----------------------------|------------|
| vbcode           | character                   | NOT NULL   |
| name_eng         | character varying           | NOT NULL   |
| name_lao         | character varying           | NOT NULL   |
| ethnicgroup_id   | character                   | NOT NULL   |
| families         | integer                     | NULL       |
| households       | integer                     | NULL       |
| population       | integer                     | NULL       |
| femalepopulation | integer                     | NULL       |
| synchronized     | timestamp without time zone | NULL       |
| need_sync        | character                   | NULL       |

### 7.10 `vb_servicedays`

| Column             | Type                        | Nullable   |
|--------------------|-----------------------------|------------|
| id                 | integer                     | NOT NULL   |
| serviceday_planned | date                        | NOT NULL   |
| start_date_time    | timestamp without time zone | NOT NULL   |
| end_date_time      | timestamp without time zone | NULL       |
| comment            | character varying           | NULL       |
| vbcode             | character                   | NOT NULL   |
| nso_employee_id    | character                   | NOT NULL   |
| synchronized       | timestamp without time zone | NULL       |
| need_sync          | character                   | NULL       |
| cash_sw            | bigint                      | NULL       |
| cash_box           | bigint                      | NULL       |
| cash_book          | bigint                      | NULL       |
| service_day_end    | character varying           | NULL       |
| close_meeting      | character varying           | NULL       |

### 7.11 `vb_targets`

| Column              | Type                        | Nullable   |
|---------------------|-----------------------------|------------|
| businessyear        | character varying           | NOT NULL   |
| members_lastyear    | bigint                      | NOT NULL   |
| members_target      | bigint                      | NOT NULL   |
| savings_lastyear    | bigint                      | NOT NULL   |
| savings_target      | bigint                      | NOT NULL   |
| loans_lastyear      | bigint                      | NOT NULL   |
| loans_target        | bigint                      | NOT NULL   |
| par_lastyear        | numeric                     | NOT NULL   |
| par_target          | numeric                     | NOT NULL   |
| profit_lastyear     | bigint                      | NOT NULL   |
| profit_target       | bigint                      | NOT NULL   |
| savingrate_lastyear | numeric                     | NOT NULL   |
| savingrate_target   | numeric                     | NULL       |
| vbcode              | character                   | NOT NULL   |
| synchronized        | timestamp without time zone | NULL       |
| need_sync           | character                   | NULL       |
| start_date          | date                        | NULL       |
| end_date            | date                        | NULL       |

---

## 8. Committee & Asset

### 8.1 `vb_committeeteam`

| Column                  | Type                        | Nullable   |
|-------------------------|-----------------------------|------------|
| id                      | integer                     | NOT NULL   |
| vbc_id                  | character                   | NULL       |
| nickname                | character varying           | NOT NULL   |
| firstname               | character varying           | NOT NULL   |
| lastname                | character varying           | NULL       |
| gender_eng              | character varying           | NOT NULL   |
| gender_lao              | character varying           | NOT NULL   |
| phonenumber             | character varying           | NULL       |
| vb_committee_role_id    | character                   | NOT NULL   |
| client_id               | uuid                        | NOT NULL   |
| start_date              | date                        | NOT NULL   |
| end_date                | date                        | NULL       |
| status_id               | character                   | NOT NULL   |
| receives_dividend       | character                   | NOT NULL   |
| real_dividend_distr_key | numeric                     | NOT NULL   |
| acc_number              | character                   | NULL       |
| vbcode                  | character                   | NOT NULL   |
| synchronized            | timestamp without time zone | NULL       |
| need_sync               | character                   | NULL       |
| vb_responsibility       | character varying           | NULL       |
| is_vbc                  | boolean                     | NULL       |

### 8.2 `vb_committeeteam_role`

| Column                 | Type              | Nullable   |
|------------------------|-------------------|------------|
| id                     | character         | NOT NULL   |
| name_eng               | character varying | NOT NULL   |
| name_lao               | character varying | NOT NULL   |
| std_dividend_distr_key | numeric           | NOT NULL   |
| need_sync              | character         | NULL       |

### 8.3 `vb_fieldstaff_matching`

| Column          | Type      | Nullable   |
|-----------------|-----------|------------|
| id              | integer   | NOT NULL   |
| nso_employee_id | character | NOT NULL   |
| vbcode          | character | NOT NULL   |
| nso_office_id   | character | NULL       |
| need_sync       | character | NULL       |

### 8.4 `vb_asset_arrangement`

| Column                      | Type                        | Nullable   |
|-----------------------------|-----------------------------|------------|
| id                          | bigint                      | NOT NULL   |
| acc_number                  | character                   | NOT NULL   |
| vb_asset_type_id            | character                   | NOT NULL   |
| inventory_no                | character                   | NOT NULL   |
| description                 | character varying           | NOT NULL   |
| purchase_date               | date                        | NOT NULL   |
| purchase_amount             | bigint                      | NOT NULL   |
| current_value               | bigint                      | NOT NULL   |
| depreciation_amount_monthly | bigint                      | NOT NULL   |
| depreciation_accumulated    | integer                     | NOT NULL   |
| date                        | date                        | NOT NULL   |
| depreciation_period_total   | character                   | NOT NULL   |
| depreciation_period_left    | character                   | NOT NULL   |
| vbcode                      | character                   | NOT NULL   |
| status_id                   | character                   | NOT NULL   |
| synchronized                | timestamp without time zone | NULL       |
| need_sync                   | character                   | NULL       |
| first_day_of_use            | date                        | NULL       |
| original_purchase_amount    | bigint                      | NULL       |
| depreciation_current_year   | date                        | NULL       |

### 8.5 `vb_asset_type`

| Column         | Type              | Nullable   |
|----------------|-------------------|------------|
| id             | character         | NOT NULL   |
| name_eng       | character varying | NOT NULL   |
| name_lao       | character varying | NOT NULL   |
| depr_time_m    | integer           | NOT NULL   |
| depr_percent_y | numeric           | NOT NULL   |
| rest_amount    | bigint            | NOT NULL   |
| need_sync      | character         | NULL       |

---

## 9. Profit Distribution

### 9.1 `profit_distribution_rule`

| Column                 | Type                        | Nullable   |
|------------------------|-----------------------------|------------|
| id                     | character varying           | NOT NULL   |
| distr_key_reserve      | numeric                     | NOT NULL   |
| distr_key_vb_committee | numeric                     | NOT NULL   |
| distr_key_member       | numeric                     | NOT NULL   |
| distr_key_vb_fund      | numeric                     | NOT NULL   |
| start_date             | date                        | NOT NULL   |
| end_date               | date                        | NULL       |
| status_id              | character                   | NOT NULL   |
| vbcode                 | character                   | NOT NULL   |
| synchronized           | timestamp without time zone | NULL       |
| need_sync              | character                   | NULL       |
| max_div_to_member      | numeric                     | NULL       |
| use_max_div_to_member  | boolean                     | NULL       |
| distr_key_welfare      | numeric                     | NULL       |

### 9.2 `profit_distribution_arrangement`

| Column                      | Type                        | Nullable   |
|-----------------------------|-----------------------------|------------|
| id                          | integer                     | NOT NULL   |
| date                        | date                        | NOT NULL   |
| total_profit_y              | bigint                      | NOT NULL   |
| total_profit_to_member      | bigint                      | NOT NULL   |
| total_profit_to_vbc         | bigint                      | NOT NULL   |
| total_profit_to_vb_fund     | bigint                      | NOT NULL   |
| total_profit_to_reserve     | bigint                      | NOT NULL   |
| profit_distribution_rule_id | character varying           | NOT NULL   |
| vbcode                      | character                   | NOT NULL   |
| synchronized                | timestamp without time zone | NULL       |
| need_sync                   | character                   | NULL       |
| total_profit_to_welfare     | bigint                      | NULL       |

### 9.3 `profit_distr_vb_fund`

| Column       | Type                        | Nullable   |
|--------------|-----------------------------|------------|
| date         | timestamp without time zone | NOT NULL   |
| acc_number   | character                   | NOT NULL   |
| amount       | bigint                      | NOT NULL   |
| vbcode       | character                   | NOT NULL   |
| synchronized | timestamp without time zone | NULL       |
| need_sync    | character                   | NULL       |

### 9.4 `profit_distr_vb_member`

| Column             | Type                        | Nullable   |
|--------------------|-----------------------------|------------|
| date               | timestamp without time zone | NOT NULL   |
| bankbooknumber     | character                   | NULL       |
| acc_number         | character                   | NOT NULL   |
| firstname1         | character varying           | NULL       |
| lastname1          | character varying           | NULL       |
| firstname2         | character varying           | NULL       |
| lastname2          | character varying           | NULL       |
| amount             | bigint                      | NOT NULL   |
| vbcode             | character                   | NOT NULL   |
| synchronized       | timestamp without time zone | NULL       |
| need_sync          | character                   | NULL       |
| interest_numerator | bigint                      | NULL       |
| gender1            | character varying           | NULL       |
| gender2            | character varying           | NULL       |

### 9.5 `profit_distr_vb_reserve`

| Column       | Type                        | Nullable   |
|--------------|-----------------------------|------------|
| date         | timestamp without time zone | NOT NULL   |
| acc_number   | character                   | NOT NULL   |
| amount       | bigint                      | NOT NULL   |
| vbcode       | character                   | NOT NULL   |
| synchronized | timestamp without time zone | NULL       |
| need_sync    | character                   | NULL       |

### 9.6 `profit_distr_vb_welfare`

| Column       | Type                        | Nullable   |
|--------------|-----------------------------|------------|
| date         | date                        | NOT NULL   |
| acc_number   | character                   | NOT NULL   |
| amount       | bigint                      | NOT NULL   |
| vbcode       | character                   | NOT NULL   |
| synchronized | timestamp without time zone | NULL       |
| need_sync    | character                   | NULL       |

### 9.7 `profit_distr_vbc`

| Column       | Type                        | Nullable   |
|--------------|-----------------------------|------------|
| date         | date                        | NOT NULL   |
| acc_number   | character                   | NOT NULL   |
| amount       | bigint                      | NOT NULL   |
| vbcode       | character                   | NOT NULL   |
| synchronized | timestamp without time zone | NULL       |
| need_sync    | character                   | NULL       |
| client_id    | uuid                        | NOT NULL   |

---

## 10. Reports & EWS

### 10.1 `bod_report`

| Column                      | Type                        | Nullable   |
|-----------------------------|-----------------------------|------------|
| report_month                | character varying           | NOT NULL   |
| vbcode                      | character                   | NOT NULL   |
| no_saving_bankbook          | integer                     | NULL       |
| no_client                   | integer                     | NULL       |
| no_female_client            | integer                     | NULL       |
| deposit                     | bigint                      | NULL       |
| withdraw                    | bigint                      | NULL       |
| current_saving_balance      | bigint                      | NULL       |
| current_loan_outstanding    | bigint                      | NULL       |
| interest_overdue            | bigint                      | NULL       |
| interest_overdue_in_percent | numeric                     | NULL       |
| par                         | numeric                     | NULL       |
| overdue0                    | bigint                      | NULL       |
| overdue1_30                 | bigint                      | NULL       |
| overdue31_90                | bigint                      | NULL       |
| overdue91_180               | bigint                      | NULL       |
| overdue_over_181            | bigint                      | NULL       |
| activityrate                | numeric                     | NULL       |
| savingrate                  | numeric                     | NULL       |
| general_reserve             | bigint                      | NULL       |
| result_of_the_year          | bigint                      | NULL       |
| amount_total_wsl            | bigint                      | NULL       |
| share_balance               | bigint                      | NULL       |
| ets_member_dividend         | numeric                     | NULL       |
| last_update                 | timestamp without time zone | NULL       |
| no_vbc                      | integer                     | NULL       |
| no_vbc_female               | integer                     | NULL       |
| no_joint_acc                | integer                     | NULL       |
| no_deposit                  | integer                     | NULL       |
| no_withdrawal               | integer                     | NULL       |
| asset_amount                | bigint                      | NULL       |
| no_loan_account             | integer                     | NULL       |
| interest_paid               | bigint                      | NULL       |
| new_loan_amount             | bigint                      | NULL       |
| principal_paid              | bigint                      | NULL       |
| interest_due                | bigint                      | NULL       |
| no_female_alone             | integer                     | NULL       |
| nso_saving_amount           | bigint                      | NULL       |
| retained_erning             | bigint                      | NULL       |
| other_income                | bigint                      | NULL       |
| other_expenses              | bigint                      | NULL       |
| village_fun_in              | bigint                      | NULL       |
| village_fun_out             | bigint                      | NULL       |
| amount_77777                | bigint                      | NULL       |
| amount_88888                | bigint                      | NULL       |
| amount_99999                | bigint                      | NULL       |
| female_saving_amount        | bigint                      | NULL       |
| no_female_loan_account      | integer                     | NULL       |
| female_loan_amount          | bigint                      | NULL       |
| written_payback_amount      | bigint                      | NULL       |
| _cash                       | bigint                      | NULL       |
| nsoreserve_amount           | bigint                      | NULL       |

### 10.2 `bol_report`

| Column                 | Type                        | Nullable   |
|------------------------|-----------------------------|------------|
| report_month           | character varying           | NOT NULL   |
| no_villagebank         | integer                     | NULL       |
| housholds              | integer                     | NULL       |
| clients                | integer                     | NULL       |
| female                 | integer                     | NULL       |
| no_saving_account      | bigint                      | NULL       |
| assets_amount          | bigint                      | NULL       |
| loan_amount            | bigint                      | NULL       |
| loan_overdue_amount    | bigint                      | NULL       |
| profitable_villagebank | integer                     | NULL       |
| no_clients_activity    | integer                     | NULL       |
| last_update            | timestamp without time zone | NULL       |

### 10.3 `report_data`

| Column       | Type                        | Nullable   |
|--------------|-----------------------------|------------|
| report_month | character varying           | NOT NULL   |
| name_en      | character varying           | NULL       |
| name_lao     | character varying           | NULL       |
| value        | double precision            | NULL       |
| format       | character varying           | NULL       |
| report_type  | character varying           | NOT NULL   |
| last_update  | timestamp without time zone | NULL       |
| row_number   | integer                     | NOT NULL   |

### 10.4 `ews`

| Column                                              | Type                        | Nullable   |
|-----------------------------------------------------|-----------------------------|------------|
| id                                                  | bigint                      | NOT NULL   |
| date                                                | timestamp without time zone | NOT NULL   |
| vbcode                                              | character                   | NOT NULL   |
| car_rate                                            | numeric                     | NULL       |
| result_car_rate                                     | numeric                     | NULL       |
| saving_rate                                         | numeric                     | NULL       |
| result_saving_rate                                  | numeric                     | NULL       |
| withdrawal_rate                                     | numeric                     | NULL       |
| result_withdrawl_rate                               | numeric                     | NULL       |
| withdraw_more_then_saving                           | numeric                     | NULL       |
| result_withdrawl_more_then_saving                   | numeric                     | NULL       |
| par                                                 | numeric                     | NULL       |
| resualt_par                                         | numeric                     | NULL       |
| interest_overdue_per_month                          | numeric                     | NULL       |
| result_interest_overdue_per_month                   | numeric                     | NULL       |
| three_months_average_saving_rate                    | numeric                     | NULL       |
| result_3_months_average_saving_rate_1               | numeric                     | NULL       |
| total_interest_overdue_outstanding_loan             | numeric                     | NULL       |
| result_total_interest_overdue_outstanding_loan_rate | numeric                     | NULL       |
| total_results                                       | numeric                     | NULL       |
| need_sync                                           | character                   | NULL       |
| cir                                                 | numeric                     | NULL       |
| result_cir                                          | numeric                     | NULL       |

---

## 11. Other Tables

### 11.1 `events`

| Column          | Type                        | Nullable   |
|-----------------|-----------------------------|------------|
| id              | integer                     | NOT NULL   |
| date            | timestamp without time zone | NOT NULL   |
| type            | character varying           | NULL       |
| nso_employee_id | character                   | NULL       |
| vbcode          | character                   | NULL       |
| status          | character varying           | NULL       |
| need_sync       | character                   | NULL       |
| description     | character varying           | NULL       |

### 11.2 `notification`

| Column            | Type                        | Nullable   |
|-------------------|-----------------------------|------------|
| id                | integer                     | NOT NULL   |
| time_created      | timestamp without time zone | NOT NULL   |
| nso_employee_id   | character                   | NULL       |
| notification_text | character varying           | NULL       |
| events_id         | integer                     | NULL       |
| need_sync         | character                   | NULL       |
| user_role_id      | character                   | NULL       |
| status_id         | character                   | NULL       |
| description       | character varying           | NULL       |
| vbcode            | character                   | NULL       |

### 11.3 `vbc_arrangement`

| Column         | Type                        | Nullable   |
|----------------|-----------------------------|------------|
| id             | integer                     | NOT NULL   |
| date           | date                        | NULL       |
| bankbooknumber | character                   | NULL       |
| vbc_name       | character varying           | NULL       |
| gender         | character varying           | NULL       |
| phonenumber    | character                   | NULL       |
| vbcode         | character                   | NOT NULL   |
| points         | smallint                    | NULL       |
| need_sync      | character                   | NULL       |
| last_update    | timestamp without time zone | NULL       |
| vbc_id         | character                   | NULL       |

### 11.4 `attribute`

| Column       | Type    | Nullable   |
|--------------|---------|------------|
| att_id       | numeric | NOT NULL   |
| att_value    | text    | NULL       |
| att_score    | numeric | NULL       |
| indicator_id | text    | NULL       |
| min          | numeric | NULL       |
| max          | numeric | NULL       |

### 11.5 `_tbl_llp_deduction`

| Column      | Type      | Nullable   |
|-------------|-----------|------------|
| vbcode      | character | NOT NULL   |
| first_year  | boolean   | NULL       |
| second_year | boolean   | NULL       |
| need_sync   | character | NULL       |

### 11.6 `account_structrue_temp`

| Column                    | Type      | Nullable   |
|---------------------------|-----------|------------|
| id                        | bigint    | NULL       |
| vbcode                    | character | NULL       |
| acc_lv1_parent_of_lv1     | character | NULL       |
| balance_lv1_parent_of_lv1 | bigint    | NULL       |
| sum_lv1_children_of_lv1   | numeric   | NULL       |
| account_lv1               | character | NULL       |
| balance_lv1               | bigint    | NULL       |
| sum_lv2                   | numeric   | NULL       |
| account_lv2               | character | NULL       |
| balance_lv2               | bigint    | NULL       |
| sum_lv3                   | numeric   | NULL       |
| account_lv3               | character | NULL       |
| balance_lv3               | bigint    | NULL       |
| sum_lv4                   | numeric   | NULL       |
| account_lv4               | character | NULL       |
| balance_lv4               | bigint    | NULL       |
| sum_lv5                   | numeric   | NULL       |
| account_lv5               | character | NULL       |
| balance_lv5               | bigint    | NULL       |
| sum_lv6                   | numeric   | NULL       |
| account_lv6               | character | NULL       |
| balance_lv6               | bigint    | NULL       |

### 11.7 `db_version`

| Column   | Type   | Nullable   |
|----------|--------|------------|
| version  | bigint | NOT NULL   |

### 11.8 `last_sync`

| Column    | Type                        | Nullable   |
|-----------|-----------------------------|------------|
| id        | bigint                      | NULL       |
| last_sync | timestamp without time zone | NULL       |

---

**หมายเหตุ:** 
- `NO` = ห้ามเป็นค่า NULL (NOT NULL)
- `YES` = อนุญาตให้เป็นค่า NULL
- รวมทั้งหมด **98+ tables** จากฐานข้อมูล PostgreSQL
