import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { BUSINESS_TYPES, BusinessInfo, EMPLOYEE_RANGES, INDUSTRIES } from "@/lib/kyb";

type Props = {
  info: BusinessInfo;
  onChange: (patch: Partial<BusinessInfo>) => void;
};

export function StepBusinessInfo({ info, onChange }: Props) {
  return (
    <>
      <h1 className="text-[22px] font-bold tracking-tight text-[#0F172A] sm:text-[26px]">Business Details</h1>
      <p className="mt-1.5 text-[15px] text-slate-600">
        Provide accurate registration and commercial details for your enterprise.
      </p>

      <hr className="my-6 border-slate-200" />

      <div className="grid gap-5 sm:grid-cols-2">
        <Input
          label="Legal Business Name"
          value={info.legalName}
          onChange={(e) => onChange({ legalName: e.target.value })}
          placeholder="Rendi Global Innovation Limited"
          required
        />
        <Select
          label="Industry"
          options={INDUSTRIES}
          value={info.industry}
          onChange={(e) => onChange({ industry: e.target.value })}
          placeholder="Select industry"
        />

        <Input
          label="Trading Name (Optional)"
          value={info.tradingName}
          onChange={(e) => onChange({ tradingName: e.target.value })}
          placeholder="Rendi Pay"
        />
        <Input
          label="Website"
          type="url"
          value={info.website}
          onChange={(e) => onChange({ website: e.target.value })}
          placeholder="https://rendipay.ng"
        />

        <Input
          label="Registration Number"
          value={info.registrationNumber}
          onChange={(e) => onChange({ registrationNumber: e.target.value })}
          placeholder="RC-1234567"
        />
        <Input
          label="Year Established"
          inputMode="numeric"
          maxLength={4}
          value={info.yearEstablished}
          onChange={(e) => onChange({ yearEstablished: e.target.value.replace(/\D/g, "") })}
          placeholder="2022"
        />

        <Select
          label="Business Type"
          options={BUSINESS_TYPES}
          value={info.businessType}
          onChange={(e) => onChange({ businessType: e.target.value })}
          placeholder="Select business type"
        />
        <Select
          label="Number of Employees"
          options={EMPLOYEE_RANGES}
          value={info.employees}
          onChange={(e) => onChange({ employees: e.target.value })}
          placeholder="Select range"
        />

        {/* Not in the Figma, but `POST /businesses` requires both - see lib/kyb.ts. */}
        <Input
          label="Business Email"
          type="email"
          value={info.email}
          onChange={(e) => onChange({ email: e.target.value })}
          placeholder="accounts@rendipay.ng"
          required
        />
        <Input
          label="Business Phone"
          type="tel"
          value={info.phone}
          onChange={(e) => onChange({ phone: e.target.value })}
          placeholder="+234 800 000 0000"
          required
        />
      </div>

      <hr className="my-6 border-slate-200" />

      <Input
        label="Registered Address"
        value={info.registeredAddress}
        onChange={(e) => onChange({ registeredAddress: e.target.value })}
        placeholder="42 Marina Road, Lagos Island, Lagos, Nigeria"
        required
      />

      <label className="mt-4 flex items-center gap-3 text-[15px] text-slate-700">
        <input
          type="checkbox"
          checked={info.sameOperatingAddress}
          onChange={(e) => onChange({ sameOperatingAddress: e.target.checked })}
          className="h-[18px] w-[18px] rounded border-slate-300 accent-[#2563EB]"
        />
        Operating Address is the same as registered address
      </label>

      {!info.sameOperatingAddress && (
        <div className="mt-4">
          <Input
            label="Operating Address"
            value={info.operatingAddress}
            onChange={(e) => onChange({ operatingAddress: e.target.value })}
            placeholder="Where the business actually trades from"
            required
          />
        </div>
      )}
    </>
  );
}
