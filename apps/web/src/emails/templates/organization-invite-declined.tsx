import { Body, Container, Head, Hr, Html, Preview, Row, Section, Tailwind, Text } from '@react-email/components';

export type OrganizationInviteDeclinedProps = {
  organization: string;
  invitee: string;
  recipient: string;
};

export function OrganizationInviteDeclined({
  organization = 'Contoso Ltd',
  invitee = 'alice.smith@contoso.com',
  recipient = 'chris.johnson@contoso.com',
}: OrganizationInviteDeclinedProps) {
  return (
    <Html lang='en' dir='ltr'>
      <Head />
      <Tailwind>
        <Body className='mx-auto my-auto bg-white px-2 font-sans'>
          <Preview>Invitation to {organization} was declined</Preview>
          <Container className='mx-auto my-10 max-w-116.25 p-5'>
            <Section>
              <Row>
                <Text className='mb-4 text-[24px] font-bold text-black'>Invitation Declined</Text>
              </Row>
              <Row>
                <Text>
                  <strong>{invitee}</strong> has declined your invitation to join <strong>{organization}</strong>.
                </Text>
              </Row>
              <Row>
                <Text className='mt-4 text-[14px] text-[#666666]'>
                  You can send another invitation at any time if needed.
                </Text>
              </Row>
            </Section>
            <Hr className='mx-0 my-6.5 w-full border border-solid border-[#eaeaea]' />
            <Text className='text-[12px] leading-6 text-[#666666]'>
              This email was intended for <span className='text-black'>{recipient}</span>. If you were not expecting
              this email, you can ignore it. If you are concerned about your account's safety, please reply to this
              email to get in touch with us.
            </Text>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
}

export default OrganizationInviteDeclined;
